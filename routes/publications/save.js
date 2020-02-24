const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');
const publishHelpers = require('../publish/steps/helpers');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;

  debug('octopus:ui:debug')(`Saving Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, (publicationErr, publication) => {
    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    if (publication.status !== 'DRAFT') {
      // TODO check if user is on the list of collaborators - otherwise error / a new 'not-yet-published' screen
      req.flash('info', 'You can only save drafts.');
      return res.redirect(`/publications/view/${publicationID}`);
    }

    return formHelpers.parseForm(req, async (err, fields, files) => {
      if (err) {
        return res.render('publish/error', { error: err });
      }

      const publicationData = await publishHelpers.mapPublicationData(fields);
      const updatedPublication = { _id: publicationID, ...publicationData };

      debug('octopus:ui:trace')(fields, files);

      // update publication object
      return api.updatePublication(updatedPublication, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publish/error', { error: updateErr });
        }

        return res.redirect(`/publications/view/${publicationID}`);
      });
    });
  });
};
