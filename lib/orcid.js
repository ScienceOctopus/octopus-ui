const request = require('request');
const config = require('./config');

const REDIRECT_URI = `${config.baseUrl}/auth/orcid/verify`;
const ORCID_CLIENT_ID = config.orcidClientId;
const ORCID_CLIENT_SECRET = config.orcidClientSecret;

const headers = {
  Accept: 'application/json',
  'User-Agent': 'Octopus Web App',
};

function generateAuthRedirect(state, returnPath) {
  return `https://orcid.org/oauth/authorize?state=${state}&client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${REDIRECT_URI}?return_path=${returnPath}`;
}

/**
 *
 *  Example response:
 *  {
 *    access_token: 'xxxx',
 *    token_type: 'bearer',
 *    refresh_token: 'yyyy',
 *    expires_in: 631138518,
 *    scope: '/authenticate',
 *    name: 'John Smith',
 *    orcid: '0000-0000-0000-0000'
 *  }
 */
function getOAuthAccessGrant(authCode, callback) {
  const payload = {
    client_id: ORCID_CLIENT_ID,
    client_secret: ORCID_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: authCode
  };

  return request.post(
    'https://orcid.org/oauth/token',
    { form: payload },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return callback(error || response.statusCode);
      }

      const authData = JSON.parse(body);
      return callback(null, authData);
    }
  );
}

function getEmailForPerson(orcid, accessToken, callback) {
  const reqUrl = `https://pub.orcid.org/v2.1/${orcid}/email`;
  const reqOpts = {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Octopus Web App',
      Authorization: `Bearer ${accessToken}`
    }
  };

  request(reqUrl, reqOpts, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return callback(error || response.statusCode);
    }

    const details = JSON.parse(body);
    const email = details.email.length >= 1 ? details.email[0].email : null;

    return callback(null, email);
  });
}

function getPersonEducations(orcid, callback) {
  const reqUrl = `https://pub.orcid.org/v3.0/${orcid}/educations`;
  const reqOpts = {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Octopus Web App'
    }
  };

  request(reqUrl, reqOpts, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return callback(error || response.statusCode);
    }

    const educations = JSON.parse(body);
    return callback(null, educations);
  });
}

function getPersonEmployments(orcid, callback) {
  const reqUrl = `https://pub.orcid.org/v3.0/${orcid}/employments`;
  const reqOpts = {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Octopus Web App'
    }
  };

  request(reqUrl, reqOpts, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return callback(error || response.statusCode);
    }

    const employments = JSON.parse(body);
    return callback(null, employments);
  });
}

function getPersonDetails(orcid, callback) {
  const reqUrl = `https://pub.orcid.org/v2.1/${orcid}/person`;
  const reqOpts = {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Octopus Web App'
    },
  };

  if (accessToken) {
    reqOpts.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  request(reqUrl, reqOpts, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return callback(error || response.statusCode);
    }

    const details = JSON.parse(body);
    return callback(null, details);
  });
}

function search(query, accessToken, callback) {
  const reqUrl = `https://pub.orcid.org/v2.1/search?q=${query}`;
  const reqOpts = {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Octopus Web App'
    },
  };

  if (accessToken) {
    reqOpts.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  request(reqUrl, reqOpts, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return callback(error || response.statusCode);
    }

    const details = JSON.parse(body);
    return callback(null, details);
  });
}

module.exports = {
  generateAuthRedirect,
  getOAuthAccessGrant,
  getPersonEducations,
  getPersonEmployments,
  getEmailForPerson,
  getPersonDetails,
  search
};
