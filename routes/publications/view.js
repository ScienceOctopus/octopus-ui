const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

const computePublicationRatings = (publication) => {
  const total = _.keys(publication.ratings).length;
  const values = _.reduce(
    publication.ratings,
    (acc, num) => acc.map((v, i) => v + num[i]),
    [0, 0, 0],
  ).map((r) => Math.round(r / total) || 0);
  return { total, values };
};

// const computeRelatedPublicationRatings = (relatedPublication) => {
//   console.log('relatedPublication', relatedPublication);
//   const  { ratings } = relatedPublication;
//   console.log('ratings', ratings);
//   const values = [];

//   ratings.forEach((rating) => values.push(rating.rating))

//   const sum = values.reduce((a, b) => a + b, 0);
//   const total = values.length;

//   return Math.round(sum / total) || 0;
// }

const attachAuthors = async (publication, accessToken) => {
  if (!publication.collaborators || !publication.collaborators.length) {
    return [];
  }

  let authors = publication.collaborators;
  authors = await Promise.all(
    authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)),
  );

  authors = authors.filter((author) => author);
  return authors;
};

const attachRatings = (publication, userId) => {
  // No ratings for draft publications
  if (publication.status === 'DRAFT') {
    return null;
  }

  const { total, values } = computePublicationRatings(publication);

  // Handle the archive case
  if (publication.status === 'ARCHIVE') {
    const disabled = true;
    return { disabled, total, values };
  }

  // Default
  const disabled = !userId
    || _.has(publication.ratings, userId)
    || _.find(publication.authors, { orcid: userId });

  return { disabled, total, values };
};

const attachPreviousRatings = async ({ _id }) => {
  // Get all archives
  let archives = await new Promise((resolve) => api.getArchive(_id, null, (err, data) => resolve(data)));
  // No prev ratings available
  if (_.isEmpty(archives)) {
    return null;
  }
  // Filter - get the ones with ratings
  archives = _.filter(archives, (a) => !_.isEmpty(a.ratings));
  // Compute values
  const prevRatings = _.reduce(
    archives,
    (acc, archive) => {
      const { total, values } = computePublicationRatings(archive);
      const newTotal = acc.total + total;
      const newValues = acc.values.map((v, i) => v + values[i]);
      return { total: newTotal, values: newValues };
    },
    { total: 0, values: [0, 0, 0] },
  );
  // Average them
  prevRatings.values = prevRatings.values.map(
    (v) => v && Math.round(v / prevRatings.total),
  );
  // return
  return prevRatings;
};

const attachRelatablePublications = (publications, publication) => {
  const { relatedPublications } = publication;

  if (relatedPublications && relatedPublications.length > 0) {
    // Filter - the ones that have not been already related to current publication
    // This list contains the current publication too
    const allRelatablePublications = _.differenceWith(publications, relatedPublications,
      (a,b) => a._id === b.publicationID
    );

    // Remove current publication from allRelatablePublications
    const relatablePublications = allRelatablePublications.filter((relatablePub) => relatablePub._id !== publication._id);
    return relatablePublications;
  }

  // Remove current publication from relatable publications
  const relatablePublications = publications.filter((relatablePub) => relatablePub._id !== publication._id);
  return relatablePublications;
}

module.exports = (req, res) => {
  const userId = _.get(req, 'session.user.orcid');
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const version = _.get(req, 'query.v');
  const publicationID = _.get(req, 'params.publicationID');
  const relatedPublicationID = _.get(req, 'query.related');

  const { publicationTypes } = res.locals;
  let relatedPublication;
  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(
    publicationID,
    async (publicationErr, publicationData) => {
      if (publicationErr || _.isEmpty(publicationData)) {
        debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
        return res.render('publications/error');
      }

      // We should work on a copy
      let publication = { ...publicationData };

      // Check if there is a request for an older version
      if (version) {
        const archive = await new Promise((resolve) => {
          return api.getArchive(
            publicationID,
            version,
            (archiveError, archiveData) => {
              if (archiveError || _.isEmpty(archiveData)) {
                debug('octopus:ui:error')(
                  `Error when trying to load Archive ${publicationID}: ${publicationErr}`,
                );
                return resolve({});
              }
              return resolve(_.first(archiveData));
            },
          );
        });

        // Our publication becomes the revision.
        // We need to keep the _id and the revision original values
        const { _id, revision } = publication;
        publication = { ...archive, _id, revision };
      } else {
        // Current version - attach prev versions
        publication.prevRatings = await attachPreviousRatings(publication);
      }

      // get all the publications for showing them in the chain
      let publications = await new Promise((resolve) => {
        return api.findPublications({}, async (publicationsErr, pubData) => {
          const results = pubData ? pubData.results : [];
          return resolve(results);
        });
      });

      // Augment the publications with the author data
      publications = await Promise.all(
        publications.map(
          (pub) => new Promise((resolve) => {
            if (!pub.collaborators) {
              return resolve(pub);
            }

            // let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });
            let authors = _.filter(pub.collaborators);
            return (async () => {
              authors = await Promise.all(
                authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)),
              );

              // Filter our undefined entries
              authors = authors.filter((author) => author);
              return resolve({ ...pub, authors });
            })();
          }),
        ),
      );

      if (relatedPublicationID) {
        relatedPublication = await new Promise((resolve) => {
          return api.getPublicationByID(relatedPublicationID, (publicationErr, publicationData) => {
            if (publicationErr || _.isEmpty(publicationData)) {
              debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
              return res.render('publications/error');
            }

            return resolve(publicationData)
          })
        })
      }

      publication.authors = await attachAuthors(publication, accessToken);
      publication.ratings = attachRatings(publication, userId);
      publication.relatablePublications = attachRelatablePublications(publications, publication);
      publication.text = encodeURIComponent(publication.text);

      const publicationType = publicationTypes.filter((type) => type.key === publication.type)[0];
      const relatedPublicationRatings = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

      res.locals.version = version;
      res.locals.publication = publication;
      res.locals.publicationType = publicationType;
      res.locals.customTitleTag = `${publicationType.title}: ${publication.title} - Octopus`;
      res.locals.publications = publications;
      res.locals.relatedPublication = relatedPublication;
      res.locals.relatedPublicationRatings = relatedPublicationRatings;

      debug('octopus:ui:trace')(res.locals);

      return res.render('publications/view', res.locals);
    },
  );
};
