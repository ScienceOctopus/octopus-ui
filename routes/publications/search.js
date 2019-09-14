const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
// const mappers = require('../lib/mappers');

module.exports = (req, res) => {
  const query = _.get(req, 'query.query');

  debug('octopus:ui:debug')(`Searching for Publications: "${query}"`);

  return api.findPublications({ query }, (publicationsErr, pubData) => {
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
