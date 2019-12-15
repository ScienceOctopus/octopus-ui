const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

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
  const total = _.keys(publication.ratings).length;
  const disabled = !userId || _.has(publication.ratings, userId) || _.find(publication.authors, { orcid: userId });
  const values = _.reduce(publication.ratings, (acc, num) => acc.map((v, i) => v + num[i]), [0, 0, 0]).map((r) => Math.round(r / total) || 0);
  return { disabled, total, values };
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
      const reversion = await new Promise((resolve) => {
        return api.getReversion(publicationID, version, (reversionError, reversionData) => {
          if (reversionError || _.isEmpty(reversionData)) {
            debug('octopus:ui:error')(`Error when trying to load Reversion ${publicationID}: ${publicationErr}`);
            return resolve({});
          }
          return resolve(reversionData);
        });
      });
      // Our publication becomes the revision.
      // We need to keep the _id and the revision original values
      const { _id, revision } = publication;
      publication = { ...reversion, _id, revision };
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
