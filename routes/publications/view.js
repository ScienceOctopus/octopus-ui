const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const publicationID = Number(req.params.publicationID);

  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, (publicationErr, publication) => {
    res.locals.publication = publication;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/view', res.locals);
  });
};
