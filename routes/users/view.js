const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const userID = req.params.userID;

  debug('octopus:ui:debug')(`Showing User ${userID}`);

  return api.getUserByID(userID, (userErr, userData) => {
    res.locals.user = userData;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
