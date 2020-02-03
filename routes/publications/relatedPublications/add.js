const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');
const stepHelpers = require('../../publish/steps/helpers');
const formHelpers = require('../../../lib/form');

module.exports = async (req, res) => {
  const publicationID = req.params.publicationID;
  const userId = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Saving a related publication for ${publicationID}`);

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get Publication data by ID
  return api.getPublicationByID(publicationID, (publicationErr, publicationData) => {
    if (publicationErr || !publicationData) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // Get data from form
    return formHelpers.parseForm(req, async (err, fields, files) => {
      if (err) {
        return res.render('publish/error', { error: err });
      }
      debug('octopus:ui:trace')(fields, files);

      const { addRelatedPublications } = fields;

      // New related publications
      const newRelatedPublications = await stepHelpers.mapRelatedPublications(addRelatedPublications, userId);

      // Merge already existing relatedPublications with the incoming ones
      // Replace current related publications
      if (publicationData.relatedPublications) {
        const updatedRelatedPublications = _.concat(publicationData.relatedPublications, newRelatedPublications);
        publicationData.relatedPublications = updatedRelatedPublications;
      } else {
        publicationData.relatedPublications = newRelatedPublications;
      }

      // Update publication object
      return api.updatePublication(publicationData, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publish/error', { error: updateErr });
        }

        return res.redirect(`/publications/view/${publicationID}`);
      });
    });

  });
};
