const _ = require('lodash');
const request = require('request');
const debug = require('debug');

const config = require('./config');

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

  return request.get(url, (err, response, body) => {
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

  return request.get(url, (err, response, body) => {
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

  if (filters.problemID) {
    url += `problemID=${filters.problemID}&`;
  }

  if (filters.stageID) {
    url += `stageID=${filters.stageID}&`;
  }

  if (filters.query) {
    url += `query=${filters.query}&`;
  }

  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.get(url, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return processResponse(body, callback);
  });
}

module.exports = {
  getPublicationTypes,
  getPublicationByID,
  findPublications,
};
