const _ = require('lodash');

const api = require('../lib/api');

module.exports = (req, res, next) => {
  const username = _.get(req, 'session.username');

  res.locals.username = username;
  res.locals.url = req.url;

  api.getPublicationTypes((publicationTypesErr, publicationTypes) => {
    if (publicationTypesErr || !publicationTypes || !publicationTypes.results) {
      return res.send('Failed to resolve publication types');
    }

    res.locals.publicationTypes = publicationTypes.results;
    return next();
  });
};
