const _ = require('lodash');

module.exports = (req, res, next) => {
  const username = _.get(req, 'session.username');

  res.locals.username = username;
  res.locals.url = req.url;
  return next();
};
