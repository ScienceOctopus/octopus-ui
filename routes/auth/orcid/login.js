const orcid = require('../../../lib/orcid');

// redirect user to ORCiD if not signed in
function orcidAuthLogin(req, res) {
  // const state = 'userdata:null';
  const state = '';
  const returnPath = req.query.returnPath || '/';

  const orcidAuthURL = orcid.generateAuthRedirect(state, returnPath);

  return res.redirect(orcidAuthURL);
}

module.exports = orcidAuthLogin;
