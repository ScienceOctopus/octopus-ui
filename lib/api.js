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

function getPublicationByID(publicationID, callback) {
  let url = config.apiUrl + '/v1/publications/getById/' + publicationID;
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

function findPublications(query, callback) {
  let url = config.apiUrl + '/v1/publications/find?';

  if (query.problemID) {
    url += `problem=${query.problemID}&`;
  }

  if (query.stageID) {
    url += `stage=${query.stageID}&`;
  }

  if (query.query) {
    url += `query=${query.query}&`;
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

function getProblemByID(problemID, callback) {
  let url = config.apiUrl + '/v1/problems/getByID/' + problemID;
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

function findProblems(query, callback) {
  let url = config.apiUrl + '/v1/problems/find?';
  if (query.query) {
    url += `query=${query.query}&`;
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
  getPublicationByID,
  findPublications,
  getProblemByID,
  findProblems,
};
