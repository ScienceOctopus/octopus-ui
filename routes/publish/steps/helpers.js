const _ = require('lodash');
const fs = require('fs');
const debug = require('debug');
const formidable = require('formidable');

const api = require('../../../lib/api');
const config = require('../../../lib/config');


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

function handleFileUpload(fileData, callback) {
  debug('octopus:ui:trace')(`handleFileUpload: ${fileData}`);

  if (!fileData) {
    return callback();
  }

  return api.uploadFile(fileData.path, fileData.type, (uploadErr, uploadResult) => {
    debug('octopus:ui:trace')('handleFile: Upload successful');
    fs.unlinkSync(fileData.path);
    return callback(uploadErr, uploadResult);
  });
}

function createNewPublicationObject(data) {
  const newPublication = {
    status: 'DRAFT',
    revision: 1,
    createdByUser: data.userId,
    dateCreated: new Date(),
    dateLastActivity: new Date(),

    type: data.publicationType,
    linkedPublications: toArray(data.linkedPublications),
    collaborators: toArray(data.publicationCollaborators),
    title: data.publicationTitle,
    summary: data.publicationSummary,
    dataUrl: data.publicationDataUrl,
    ethicalPermissions: data.ethicalPermissions,
    keywords: toArray(data.publicationKeywords),
    fundingStatement: data.fundingStatement,
    coiDeclaration: data.coiDeclaration,
    carriedOut: !!data.publicationCarriedOut,
    text: data.publicationText,
    file: data.publicationFile,
    fileId: data.publicationFileId
  };

  return newPublication;
}

function toArray (string) {
  return (string || '').split(/,|\s/).filter(_.identity);
}

module.exports = {
  parseForm,
  handleFileUpload,
  createNewPublicationObject,
};
