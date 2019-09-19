const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const query = {
    phrase: _.get(req, 'query.phrase'),
    parentProblem: _.get(req, 'query.parentProblem'),
    type: _.get(req, 'query.type'),
  };

  debug('octopus:ui:debug')(`Searching for Publications. Query: "${query.phrase || ''}"`);

  return api.findPublications(query, (publicationsErr, pubData) => {
    const data = pubData;

    res.locals.query = query;

    res.locals.publications = {
      totalCount: data && data.total ? data.total : 0,
      displayedCount: data && data.results ? data.results.length : 0,
      results: data && data.results ? data.results : [],
    };

    return res.render('publications/search', res.locals);
  });
};
