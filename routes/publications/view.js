const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

const computePublicationRatings = (publication) => {
  const total = _.keys(publication.ratings).length;
  const values = _.reduce(publication.ratings, (acc, num) => acc.map((v, i) => v + num[i]), [0, 0, 0]).map((r) => Math.round(r / total) || 0);
  return { total, values };
};

const attachAuthors = async (publication, accessToken) => {
  if (!publication.collaborators || !publication.collaborators.length) {
    return [];
  }

  let authors = publication.collaborators;
  authors = await Promise.all(authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)));
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
  const disabled = !userId || _.has(publication.ratings, userId) || _.find(publication.authors, { orcid: userId });
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
  const prevRatings = _.reduce(archives, (acc, archive) => {
    const { total, values } = computePublicationRatings(archive);
    const newTotal = acc.total + total;
    const newValues = acc.values.map((v, i) => v + values[i]);
    return { total: newTotal, values: newValues };
  }, { total: 0, values: [0, 0, 0] });
  // Average them
  prevRatings.values = prevRatings.values.map((v) => Math.round(v / prevRatings.total));
  // return
  return prevRatings;
};

module.exports = (req, res) => {
  const userId = _.get(req, 'session.user.orcid');
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const version = _.get(req, 'query.v');
  const publicationID = req.params.publicationID;
  const { publicationTypes } = res.locals;

  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publicationData) => {
    if (publicationErr || _.isEmpty(publicationData)) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // We should work on a copy
    let publication = { ...publicationData };

    // Check if there is a request for an older version
    if (version) {
      const archive = await new Promise((resolve) => {
        return api.getArchive(publicationID, version, (archiveError, archiveData) => {
          if (archiveError || _.isEmpty(archiveData)) {
            debug('octopus:ui:error')(`Error when trying to load Archive ${publicationID}: ${publicationErr}`);
            return resolve({});
          }

          return resolve(_.first(archiveData));
        });
      });
      // Our publication becomes the revision.
      // We need to keep the _id and the revision original values
      const { _id, revision } = publication;
      publication = { ...archive, _id, revision };
    } else {
      // Current version - attach prev versions
      publication.prevRatings = await attachPreviousRatings(publication);
    }

    publication.authors = await attachAuthors(publication, accessToken);
    publication.ratings = attachRatings(publication, userId);

    const publicationType = publicationTypes.filter((type) => type.key === publication.type)[0];

    res.locals.version = version;
    res.locals.publication = publication;
    res.locals.publicationType = publicationType;
    res.locals.customTitleTag = `${publicationType.title}: ${publication.title} - Octopus`;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/view', res.locals);
  });
};
