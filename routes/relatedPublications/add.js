const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');
const helpers = require('./helpers');

function insertRelatedPublications(relatedPublication, res) {
  api.createRelatedPublication(
    relatedPublication,
    (createRelatedPubErr, createRelatedPubResult) => {
      if (
        createRelatedPubErr
        || !createRelatedPubResult
        || !createRelatedPubResult.insertedId
      ) {
        return res.render('publish/error', { error: createRelatedPubErr });
      }

      return createRelatedPubResult;
    },
  );
}

module.exports = async (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');
  const userId = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Saving a related publication for ${publicationID}`);

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get Publication data by ID
  return api.getPublicationByID(
    publicationID,
    (publicationErr, publicationData) => {
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
        const newRelatedPublications = await helpers.mapRelatedPublications(
          publicationID,
          addRelatedPublications,
          userId,
        );

        newRelatedPublications.forEach((pub) => insertRelatedPublications(pub, res));
        return res.redirect(`/publications/view/${publicationID}`);
      });
    },
  );
};
