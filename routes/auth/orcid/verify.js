// perform auth logic after returning from ORCiD
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
        (err, success) => {
          if (err) {
            console.error('err', err);
          }
          // console.log('success', success);

          // TODO: sanitise url
          return res.redirect(finalRedirect || '/');
        },
      );
    });
  });

}

module.exports = orcidAuthVerify;
