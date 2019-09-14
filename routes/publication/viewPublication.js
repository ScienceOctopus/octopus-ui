const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const publicationID = Number(req.params.publicationID);
  const problemID = Number(req.params.problemID);

  debug('octopus:ui:debug')(`Showing Publication ${publicationID} (in Problem ${problemID})`);

  return api.getProblemByID(problemID, (problemErr, problem) => {
    return api.getPublicationByID(publicationID, (publicationErr, publication) => {
      res.locals.problem = problem;
      res.locals.publication = publication;

      // debug('octopus:ui:trace')(res.locals);

      return res.render('publication/viewPublication', res.locals);
    });
  });
};
