const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');
const relatedPublicationHelpers = require('../relatedPublications/helpers');
const sanitizeUserHtml = require('../../lib/sanitizeUserHtml');

const computePublicationRatings = (publication) => {
  const total = _.keys(publication.ratings).length;
  const values = _.reduce(
    publication.ratings,
    (acc, num) => acc.map((v, i) => v + num[i]),
    [0, 0, 0],
  ).map((r) => Math.round(r / total) || 0);
  return { total, values };
};

const computeRelatedPublicationRatings = (ratings) => {
  const values = [];

  ratings.forEach((rating) => values.push(parseInt(rating.rating, 10)));

  const sum = values.reduce((acc, num) => acc + num, 0);
  const total = values.length;

  return Math.round(sum / total) || 0;
};

const attachAuthors = async (publication, accessToken) => {
  if (!publication.collaborators || !publication.collaborators.length) {
    return [];
  }

  let authors = publication.collaborators;
  authors = await Promise.all(
    authors.map((author) => userHelpers.findUserByID(author.userID, accessToken)),
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

const attachRedFlags = async (publication) => {
  const { _id: publicationID } = publication;

  const redFlags = await new Promise((resolve) => api.findResolutions({ publicationID }, (_resolutionErr, resolutionsData) => resolve(resolutionsData)));

  if (redFlags && redFlags.length > 0) {
    return redFlags;
  }

  return null;
};

// Count publications based on type
const typeCounter = (publicationTypes, publications) => {
  const countedPublications = [];

  publicationTypes.forEach((publicationType) => {
    const filteredPublications = publications.filter(
      (publication) => publication.type === publicationType.key,
    );

    countedPublications.push({
      type: publicationType.key,
      counter: filteredPublications.length,
    });
  });

  return countedPublications;
};

// Get linked publications for current publication by type
const getLinkedPublicationsByType = (publication, publications, type) => {
  if (!_.isEmpty(publication.linkedPublications)) {
    const { linkedPublications } = publication;

    const linkedProblems = publications.filter((pub) => {
      return linkedPublications.includes(pub._id) && (pub.type === type);
    });

    linkedProblems.forEach((linkedProblem) => {
      linkedProblem.attachedRatings = attachRatings(linkedProblem, null);
    });

    return linkedProblems;
  }

  return [];
};

module.exports = (req, res) => {
  const userId = _.get(req, 'session.user.orcid');
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const version = _.get(req, 'query.v');
  const publicationID = _.get(req, 'params.publicationID');
  const relatedPublicationID = _.get(req, 'query.related');
  const viewRelatedPubs = _.get(req, 'query.viewRelated');

  const { publicationTypes } = res.locals;
  let relatedPublication;
  let mapRelatedPublications;

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
                authors.map((author) => userHelpers.findUserByID(author.userID, accessToken)),
              );

              // Get linked problems for each publication
              const linkedProblems = getLinkedPublicationsByType(pub, publications, 'PROBLEM');
              const linkedReviews = getLinkedPublicationsByType(pub, publications, 'REVIEW');
              const countedLinkedProblems = linkedProblems.length;
              const countedLinkedReviews = linkedReviews.length;
              const countedLinked = countedLinkedProblems + countedLinkedReviews;

              // Filter our undefined entries
              authors = authors.filter((author) => author);

              return resolve({
                ...pub,
                authors,
                linkedProblems,
                countedLinked,
                countedLinkedReviews,
              });
            })();
          }),
        ),
      );

      if (relatedPublicationID && viewRelatedPubs) {
        relatedPublication = await new Promise((resolve) => {
          return api.getPublicationByID(relatedPublicationID, (foundPublicationErr, foundPublicationData) => {
            if (foundPublicationErr || _.isEmpty(foundPublicationData)) {
              debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${foundPublicationErr}`);
              return res.render('publications/error');
            }

            return resolve(foundPublicationData);
          });
        });

        const specificRelatedPub = await relatedPublicationHelpers.getSpecificRelatedPub(publicationID, relatedPublicationID);

        if (specificRelatedPub) {
          const { ratings } = specificRelatedPub;
          const userAlredyRated = ratings.some((userRating) => userRating.createdByUser === userId);
          relatedPublication.userAlredyRated = userAlredyRated;
        } else {
          relatedPublication.relatedPublication = false;
        }
      }

      if (viewRelatedPubs) {
        // get all the related publications for current publication
        const relatedPublications = await new Promise((resolve) => {
          (async () => {
            const allRelatedPubsByPubID = await relatedPublicationHelpers.getRelatedPubsByPubID(publicationID);
            const allRelatedPubsByRelatedTo = await relatedPublicationHelpers.getRelatedPubsByRelatedTo(publicationID);
            const allRelatedPublications = allRelatedPubsByPubID.concat(allRelatedPubsByRelatedTo);
            return resolve(allRelatedPublications);
          })();
        });

        // get info for all related publications from the current publication
        mapRelatedPublications = await new Promise(async (resolve) => {
          const relatedPubs = [];

          await Promise.all(
            relatedPublications.map(async (relatedPub) => {
              const { publicationID: relatedPubID, relatedTo, ratings } = relatedPub;
              let rating;

              // No ratings for draft publications
              if (publication.status === 'DRAFT') {
                rating = null;
              } else {
                rating = computeRelatedPublicationRatings(ratings);
              }

              const relatedPubByRelatedTo = await new Promise((resolveRelated) => api.getPublicationByID(relatedTo, (err, foundPub) => {
                if (foundPub) {
                  return resolveRelated({
                    ...relatedPub,
                    rating,
                    filterID: foundPub._id,
                    publicationType: foundPub.type,
                    publicationTitle: foundPub.title,
                  });
                }

                return resolveRelated();
              }));

              const relatedPubByPublicationId = await new Promise((resolveRelated) => api.getPublicationByID(relatedPubID, (err, foundPub) => {
                if (foundPub) {
                  return resolveRelated({
                    ...relatedPub,
                    rating,
                    filterID: foundPub._id,
                    publicationType: foundPub.type,
                    publicationTitle: foundPub.title,
                  });
                }

                return resolveRelated();
              }));

              relatedPubs.push(relatedPubByRelatedTo);
              relatedPubs.push(relatedPubByPublicationId);
            }),
          );

          // Remove null / undefined elements from relatedPubs Array
          const availableRelatedPubs = relatedPubs.filter((relatedPub) => relatedPub);

          // Remove current publication from relatable publications
          const filteredPubs = availableRelatedPubs.filter((relatedPub) => relatedPub.filterID !== publication._id);

          if (publication.status === 'DRAFT') {
            return resolve(filteredPubs);
          }

          if (publication.status === 'LIVE') {
            const filteredRelatedPubs = filteredPubs.filter(({ rating }) => rating >= 0);
            return resolve(filteredRelatedPubs);
          }

          return resolve();
        });
      }

      const linkedProblems = getLinkedPublicationsByType(publication, publications, 'PROBLEM');
      const linkedReviews = getLinkedPublicationsByType(publication, publications, 'REVIEW');

      publication.authors = await attachAuthors(publication, accessToken);
      publication.ratings = attachRatings(publication, userId);
      // publication.text = encodeURIComponent(publication.text);
      publication.text = sanitizeUserHtml(publication.text);
      publication.redFlags = await attachRedFlags(publication);
      publication.viewRelatedPubs = viewRelatedPubs;
      publication.relatedPublications = mapRelatedPublications;
      publication.relatablePublications = relatedPublicationHelpers.attachRelatablePublications(publications, publication);
      publication.linkedProblems = linkedProblems;
      publication.linkedReviews = linkedReviews;
      publication.countedLinked = linkedProblems.length + linkedReviews.length;

      const publicationType = publicationTypes.filter((type) => type.key === publication.type)[0];
      const relatedPublicationRatings = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
      const countedPublications = typeCounter(publicationTypes, publications);

      res.locals.version = version;
      res.locals.publication = publication;
      res.locals.publicationType = publicationType;
      res.locals.customTitleTag = `${publicationType.title}: ${publication.title} - Octopus`;
      res.locals.publications = publications;
      res.locals.relatedPublication = relatedPublication;
      res.locals.relatedPublicationRatings = relatedPublicationRatings;
      res.locals.countedPublications = countedPublications;

      debug('octopus:ui:trace')(res.locals);

      return res.render('publications/view', res.locals);
    },
  );
};
