const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');
const helpers = require('./helpers');

module.exports = (req, res) => {
  debug('octopus:ui:debug')('Saving a publication');

  helpers.parseForm(req, (err, fields, files) => {
    const fileData = _.first(files);
    const newPublication = helpers.createNewPublicationObject(fields);

    debug('octopus:ui:trace')(`Saving a file for publication ${newPublication}`);

    return api.createPublication(newPublication, (createPubErr, createPubResult) => {
      if (createPubErr || !createPubResult || !createPubResult.insertedId) {
        return res.render('publish/error', { error: createPubErr });
      }

      // eslint-disable-next-line
      return res.redirect(`/publications/view/${createPubResult.insertedId}`);
    });
  });
};
