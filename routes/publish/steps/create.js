const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');
const helpers = require('./helpers');
const formHelpers = require('../../../lib/form');

module.exports = (req, res) => {
  debug('octopus:ui:debug')('Saving a publication');

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  return formHelpers.parseForm(req, async (err, fields, files) => {
    const fileData = _.first(files);
    const data = { ...fields, userId: req.session.user.orcid };
    const newPublication = await helpers.createNewPublicationObject(data);

    debug('octopus:ui:trace')(`Saving a file for publication ${newPublication}`);
    debug('octopus:ui:trace')(`Publication file data ${fileData}`);

    return api.createPublication(newPublication, (createPubErr, createPubResult) => {
      if (createPubErr || !createPubResult || !createPubResult.insertedId) {
        return res.render('publish/error', { error: createPubErr });
      }

      return res.redirect(`/publications/view/${createPubResult.insertedId}`);
    });
  });
};
