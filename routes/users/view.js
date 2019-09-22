const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const orcid = req.params.orcid;

  debug('octopus:ui:debug')(`Showing User Profile: ${orcid}`);

  return api.getUserByORCiD(orcid, (userErr, userData) => {
    res.locals.person = userData;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
