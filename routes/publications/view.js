const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

module.exports = (req, res) => {
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const publicationID = req.params.publicationID;
  const { publicationTypes } = res.locals;

  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publicationData) => {
    const publication = { ...publicationData };

    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // Augment the publications with the author data
    if (publication.collaborators) {
      let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });
      // Augment authors list
      authors = await Promise.all(authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)));
      // Filter our undefined entries
      authors = authors.filter((author) => author);

      publication.authors = authors;
    }

    const pubType = publicationTypes.filter((type) => type.key === publication.type)[0];

    res.locals.publication = publication;
    res.locals.customTitleTag = `${pubType.title}: ${publication.title} - Octopus`;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/view', res.locals);
  });
};
