const api = require('../lib/api');
const config = require('../lib/config');

module.exports = (req, res, next) => {
  if (config.useAdminAccount && !req.session.user) {
    req.session.user = {
      orcid: '0000-0000-0000-0000',
      email: 'admin@science-octopus.org',
      name: 'Octopus Admin',
    };
  }

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
