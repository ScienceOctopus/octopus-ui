const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const query = _.get(req, 'query.query');

  debug('octopus:ui:debug')(`Searching for Publications: "${query}"`);

  return api.findPublications({ query }, (queryErr, queryResults) => {
    const results = queryResults;

    const context = {
      query,
      resultsTotal: results && results.total ? results.total : 0,
      resultsDisplayed: results && results.results ? results.results.length : 0,
      results: results && results.results ? results.results : [],
    };

    res.locals = _.merge(res.locals, context);

    return res.render('publication/searchPublications', res.locals);
  });
};
