const _ = require('lodash');

const api = require('../lib/api');

module.exports = (req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.url = req.url;

  api.getPublicationTypes((publicationTypesErr, publicationTypes) => {
    if (publicationTypesErr || !publicationTypes || !publicationTypes.results) {
      return res.send('Failed to resolve publication types');
    }

    res.locals.publicationTypes = publicationTypes.results;
    return next();
  });
};
