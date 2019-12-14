const _ = require('lodash');
const fs = require('fs');
const debug = require('debug');

const api = require('../../../lib/api');

function toArray(string) {
  return (string || '').split(/,|\s/).filter(_.identity);
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

function mapCollaborators(collaborators) {
  const status = 'UNCONFIRMED';
  const role = 'author';
  const dateCreated = new Date();
  return toArray(collaborators).map((userID) => ({
    userID,
    role,
    dateCreated,
    status,
  }));
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
    collaborators: mapCollaborators(data.publicationCollaborators),
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
    fileId: data.publicationFileId,
  };

  return newPublication;
}

module.exports = {
  handleFileUpload,
  createNewPublicationObject,
};
