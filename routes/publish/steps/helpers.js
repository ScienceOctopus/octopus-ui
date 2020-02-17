const _ = require('lodash');
const fs = require('fs');
const debug = require('debug');

const api = require('../../../lib/api');

function toArray(string) {
  if (typeof string !== 'string') {
    return string;
  }
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
  return toArray(collaborators).map((userID) => ({
    userID,
    role,
    status,
  }));
}

async function mapPublicationData(data) {
  return {
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
}

async function createNewPublicationObject(data) {
  const mappedPublicationData = await mapPublicationData(data);

  const newPublication = {
    status: 'DRAFT',
    revision: 1,
    createdByUser: data.userId,
    dateCreated: new Date(),
    dateLastActivity: new Date(),
    ...mappedPublicationData,
  };

  return newPublication;
}

function aggregatePublicationFormState(fields) {
  const publicationState = {
    userId: fields.userId,
    type: fields.publicationType,
    linkedPublications: fields.linkedPublications,
    collaborators: fields.publicationCollaborators,
    title: fields.publicationTitle,
    summary: fields.publicationSummary,
    dataUrl: fields.publicationDataUrl,
    ethicalPermissions: fields.ethicalPermissions,
    keywords: fields.publicationKeywords,
    fundingStatement: fields.fundingStatement,
    coiDeclaration: fields.coiDeclaration,
    relatedPublications: fields.relatedPublications,
    carriedOut: fields.publicationCarriedOut,
    text: fields.publicationText,
    file: fields.publicationFile,
    fileId: fields.publicationFileId,
  };

  return publicationState;
}

module.exports = {
  handleFileUpload,
  mapPublicationData,
  createNewPublicationObject,
  aggregatePublicationFormState,
};
