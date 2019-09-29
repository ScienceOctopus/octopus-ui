const request = require('request');
const debug = require('debug');
const fs = require('fs');

const config = require('./config');

const headers = {
  authKey: config.apiAuthKey,
  authSecret: config.apiAuthSecret,
  Accept: 'application/json',
  'content-type': 'application/json',
};

function processResponse(data, callback) {
  try {
    const parsedBody = JSON.parse(data);
    return callback(null, parsedBody);
  } catch (parseErr) {
    return callback(parseErr);
  }
}

function getPublicationTypes(callback) {
  const url = config.apiUrl + '/v1/publicationTypes';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, { headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function getPublicationByID(publicationID, callback) {
  const url = config.apiUrl + '/v1/publications/getById/' + publicationID;
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, { headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function createPublication(publicationData, callback) {
  const url = config.apiUrl + '/v1/publications/create';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { form: publicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function findPublications(filters, callback) {
  let url = config.apiUrl + '/v1/publications/find?';

  if (filters.parentProblem) {
    url += `parentProblem=${filters.parentProblem}&`;
  }

  if (filters.type) {
    url += `type=${filters.type}&`;
  }

  if (filters.phrase) {
    url += `phrase=${filters.phrase}&`;
  }

  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, { headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function getUserByORCiD(orcid, callback) {
  const url = config.apiUrl + '/v1/users/getByORCiD/' + orcid;
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, { headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function upsertUser(data, callback) {
  const url = config.apiUrl + '/v1/users/upsert';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { form: JSON.stringify(data), headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function uploadFile(filepath, mimetype, callback) {
  const url = config.apiUrl + '/v1/files/upload';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  const formData = {
    // linkedPublicationID: 'none',
    // authorOrcid: '0000-0000-0000-0000',
    // mimetype,
    document: fs.createReadStream(filepath),
  };

  const authOnlyHeaders = {
    authKey: headers.authKey,
    authSecret: headers.authSecret,
  };

  return request.post({ url, formData, authOnlyHeaders }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

function getFileContents(id, callback) {
  const url = `${config.apiUrl}/v1/files/getContent/${id}`;
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, { headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}`);
    return processResponse(body, callback);
  });
}

module.exports = {
  getPublicationTypes,
  getPublicationByID,
  createPublication,
  findPublications,
  getUserByORCiD,
  upsertUser,
  uploadFile,
  getFileContents,
};
