const _ = require('lodash');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const problemID = Number(req.params.problemID);

  return api.getProblemByID(problemID, (queryErr, problemResult) => {
    return api.findPublications({ problemID }, (publicationsErr, publications) => {
      res.locals.problem = problemResult;
      res.locals.publications = publications;

      return res.render('problems/view', res.locals);
    });
  });
};
