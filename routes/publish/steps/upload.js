const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');
const helpers = require('./helpers');

module.exports = (req, res) => {
  debug('octopus:ui:debug')('Uploading a publication');

  helpers.parseForm(req, (err, fields, files) => {
    const fileData = _.first(files);
    const newPublication = helpers.createNewPublicationObject(fields);

    debug('octopus:ui:trace')(`Saving a file for publication ${newPublication}`);

    helpers.handleFileUpload(fileData, (uploadErr, uploadResult) => {
      if (uploadErr) {
        return res.send('ERROR');
      }

      newPublication.text = _.get(uploadResult, 'text');
      newPublication.publicationFiles = _.get(uploadResult, '_id');

      return api.createPublication(newPublication, (createPubErr, createPubResult) => {
        if (createPubErr || !createPubResult || !createPubResult.insertedId) {
          return res.render('publish/error', { error: createPubErr });
        }

        res.locals.text = newPublication.text;

        return res.render('publish/steps/step-3', res.locals);
      });
    });
  });
};
