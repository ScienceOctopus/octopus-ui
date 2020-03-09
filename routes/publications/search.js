const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

module.exports = (req, res) => {
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const query = {
    phrase: _.get(req, 'query.phrase'),
    parentProblem: _.get(req, 'query.parentProblem'),
    type: _.get(req, 'query.type'),
  };

  debug('octopus:ui:debug')(`Searching for Publications. Query: "${query.phrase || ''}"`);

  return api.findPublications(query, async (publicationsErr, pubData) => {
    const data = pubData;

    res.locals.query = query;

    let results = data ? data.results || [] : [];


    // Augment the publications with red flags
    results = await Promise.all(results.map((publication) => new Promise((resolve) => {
      const { _id: publicationID } = publication;
      api.findResolutions({ publicationID }, (_resolutionErr, resolutionsData) => resolve({ ...publication, resolutions: resolutionsData }));
    })));

    // Augment the publications with the author data
    results = await Promise.all(results.map((publication) => new Promise((resolve) => {
      if (!publication.collaborators) {
        return resolve(publication);
      }

      // let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });
      let authors = _.filter(publication.collaborators);

      return (async () => {
        authors = await Promise.all(authors.map((author) => userHelpers.findUserByOrcid(author.userID, accessToken)));
        // Filter our undefined entries
        authors = authors.filter((author) => author);

        return resolve({ ...publication, authors });
      })();
    })));

    res.locals.publications = {
      totalCount: data && data.total ? data.total : 0,
      displayedCount: data && data.results ? data.results.length : 0,
      results,
    };
    res.locals.customTitleTag = 'Publication Search';

    return res.render('publications/search', res.locals);
  });
};
