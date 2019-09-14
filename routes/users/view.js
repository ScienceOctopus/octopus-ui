const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const userID = Number(req.params.userID);

  debug('octopus:ui:debug')(`Showing User ${userID}`);

  return api.getUserByID(userID, (userErr, userData) => {
    res.locals.user = userData;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('users/view', res.locals);
  });
};
