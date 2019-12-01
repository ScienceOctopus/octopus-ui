// perform auth logic after returning from ORCiD
const debug = require('debug');
const api = require('../../../lib/api');
const orcid = require('../../../lib/orcid');

function orcidAuthVerify(req, res) {
  const authCode = req.query.code;
  const finalRedirect = req.query.return_path;
  // const state = req.query.state;

  // console.log('authCode', authCode);
  // console.log('finalRedirect', finalRedirect);
  // console.log('state', state);

  orcid.getOAuthAccessGrant(authCode, (err, authData) => {
    if (err) {
      console.log('getOAuthAccessGrant err', err);
    }
    if (!authData) {
      return res.send('No valid response returned');
    }

    const userOrcid = authData.orcid;
    const userAccessToken = authData.access_token;

    return orcid.getEmailForPerson(userOrcid, userAccessToken, (emailErr, email) => {
      if (emailErr) {
        console.log('getEmailForPerson emailErr', emailErr);
      }

      debug('octopus:ui:trace')(email);

      // resolve user from DB or create a new one

      const userData = {
        name: authData.name,
        orcid: authData.orcid,
        email: authData.email,
      };

      const sessionData = {
        accessToken: authData.access_token,
      };

      req.session.user = userData;
      req.session.authOrcid = sessionData;

      api.upsertUser(
        {
          where: { orcid: userData.orcid },
          data: userData,
        },
        (userErr, success) => {
          if (userErr) {
            console.error('err', userErr);
          }
          debug('octopus:ui:trace')(success);

          // TODO: sanitise url
          return res.redirect(finalRedirect || '/');
        },
      );
    });
  });
}

module.exports = orcidAuthVerify;
