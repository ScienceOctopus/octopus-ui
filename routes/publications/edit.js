const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  debug('octopus:ui:debug')(`Editing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, (publicationErr, publication) => {
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

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/edit', res.locals);
  });
};
