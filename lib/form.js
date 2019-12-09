const _ = require('lodash');
const formidable = require('formidable');
const debug = require('debug');
const config = require('./config');

function parseForm(req, callback) {
  const form = new formidable.IncomingForm();
  form.maxFields = 30;
  form.keepExtensions = true;
  form.type = 'multipart';
  form.maxFileSize = config.maxFileSizeMB * 1024 * 1024;

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err);
      debug('octopus:ui:error')(`Error while parsing form: ${err}`);
      return callback('Error while processing form.');
    }

    const filesData = [];

    _.forEach(files, (f, key) => {
      if (!f.size && !f.name.length) {
        return;
      }
      const mappedFile = {
        filetype: key,
        filesize: f.size,
        filename: f.name.trim(),
        mimetype: f.type,
        lastModifiedDate: f.lastModifiedDate,
        path: f.path,
      };

      filesData.push(mappedFile);
    });

    return callback(null, fields, filesData);
  });
}

module.exports = {
  parseForm,
};
