const _ = require('lodash');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  return api.findProblems({}, (queryErr, queryResults) => {
    const results = queryResults;

    const context = {
      // query,
      resultsTotal: results && results.total ? results.total : 0,
      resultsDisplayed: results && results.results ? results.results.length : 0,
      results: results && results.results ? results.results : [],
    };

    res.locals = _.merge(res.locals, context);

    return res.render('problems/exploreProblems', res.locals);
  });
};
