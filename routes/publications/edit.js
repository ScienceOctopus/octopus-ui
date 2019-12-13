const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  debug('octopus:ui:debug')(`Editing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publicationData) => {
    const publication = { ...publicationData };

    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    if (publication.status !== 'DRAFT') {
      req.flash('info', 'This publication has already been published. Redirecting to view mode.');
      return res.redirect(`/publications/view/${publicationID}`);
    }

    res.locals.publication = publication;
    res.locals.customTitleTag = `Edit ${publication.title}`;

    if (publication.collaborators) {
      let authors = publication.collaborators;
      // Augment authors list
      authors = await Promise.all(authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)));
      // Filter our undefined entries
      authors = authors.filter((author) => author);

      publication.authors = authors;
    }

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/edit', res.locals);
  });
};
