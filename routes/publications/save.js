const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');
const userHelpers = require('../users/helpers');
const publishHelpers = require('../publish/steps/helpers');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const accessToken = _.get(req, 'session.authOrcid.accessToken');

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

      if (updatedPublication.collaborators && updatedPublication.collaborators.length > 1) {
        const { collaborators } = updatedPublication;
        const orcidIds = collaborators.map((collaborator) => collaborator.userID);

        // Returns data for the collaborators that doesn't exists in our DB
        const newAuthorsList = await new Promise((resolve) => resolve(userHelpers.checkForNewUsers(orcidIds, accessToken)));

        // Insert New Users List in DB
        await userHelpers.insertManyUsers(newAuthorsList, res);
      }

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
