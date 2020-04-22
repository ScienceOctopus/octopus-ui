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

function findRelatedPublications(filters, callback) {
  let url = config.apiUrl + '/v1/relatedPublications/find?';

  if (filters.publicationID) {
    url += `publicationID=${filters.publicationID}&`;
  }

  if (filters.relatedTo) {
    url += `relatedTo=${filters.relatedTo}&`;
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

function getArchive(publicationID, revision, callback) {
  const url = config.apiUrl + '/v1/archive/getById/' + publicationID + '/' + revision;
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

  return request.post(url, { json: publicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function createRelatedPublication(relatedPublicationData, callback) {
  const url = config.apiUrl + '/v1/relatedPublications/create';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: relatedPublicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function createArchive(publicationData, callback) {
  const url = config.apiUrl + '/v1/archive/create';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: publicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function updatePublication(publicationData, callback) {
  const url = config.apiUrl + '/v1/publications/update';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: publicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function updateRelatedPublication(relatedPublicationData, callback) {
  const url = config.apiUrl + '/v1/relatedPublications/update';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: relatedPublicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function downloadPublicationPDF(publicationID, baseUrl, callback) {
  const url = config.apiUrl + '/v1/publications/download/' + publicationID;
  const pdfHeaders = {
    ...headers,
    baseUrl,
    Accept: 'application/pdf',
  };

  debug('octopus:ui:trace')(`Making call to ${url}`);
  return request.get(url, { publicationID, headers: pdfHeaders }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, response);
  });
}

function findPublications(filters, callback) {
  let url = config.apiUrl + '/v1/publications/find?';

  const status = (typeof filters.status === 'string' ? filters.status.toUpperCase() : 'LIVE');

  url += `status=${status}&`;

  if (filters.parentProblem) {
    url += `parentProblem=${filters.parentProblem}&`;
  }

  if (filters.type) {
    url += `type=${filters.type}&`;
  }

  if (filters.phrase) {
    url += `phrase=${filters.phrase}&`;
  }

  if (filters.createdByUser) {
    url += `createdByUser=${filters.createdByUser}&`;
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

function redFlagPublication(redFlagPublicationData, callback) {
  const url = config.apiUrl + '/v1/redFlagPublication/add';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: redFlagPublicationData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function getResolutionByID(resolutionID, callback) {
  const url = config.apiUrl + '/v1/redFlagPublication/getById/' + resolutionID;
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

function updateResolution(resolutionData, callback) {
  const url = config.apiUrl + '/v1/redFlagPublication/update';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: resolutionData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}


function findResolutions(filters, callback) {
  let url = config.apiUrl + '/v1/redFlagPublication/find?';

  if (filters.publicationID) {
    url += `publicationID=${filters.publicationID}&`;
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

function insertUser(userData, callback) {
  const url = config.apiUrl + '/v1/users/insert';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: userData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
  });
}

function insertManyUsers(userData, callback) {
  const url = config.apiUrl + '/v1/users/insertMany';
  debug('octopus:ui:trace')(`Making call to ${url}`);

  return request.post(url, { json: userData, headers }, (err, response, body) => {
    if (err) {
      console.error(err);
      return callback(err);
    }

    debug('octopus:ui:trace')(`Response from ${url}: ${body}`);
    return callback(null, body);
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

  return request.post({ url, formData, headers: authOnlyHeaders }, (err, response, body) => {
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
    // return processResponse(body, callback);
    return callback(null, body);
  });
}

function getFile(id, callback) {
  const url = `${config.apiUrl}/v1/files/get/${id}`;
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
  findRelatedPublications,
  getArchive,
  createPublication,
  createRelatedPublication,
  createArchive,
  updatePublication,
  updateRelatedPublication,
  findPublications,
  downloadPublicationPDF,
  redFlagPublication,
  getResolutionByID,
  updateResolution,
  findResolutions,
  getUserByORCiD,
  upsertUser,
  insertUser,
  insertManyUsers,
  uploadFile,
  getFile,
  getFileContents,
};
