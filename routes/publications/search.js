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

  return api.findPublications(query, async (publicationsErr, pubData) => {
    const data = pubData;

    res.locals.query = query;

    let results = data ? data.results || [] : [];

    // Augment the publications with the author data
    results = await Promise.all(results.map((publication) => new Promise(async (resolve) => {
      if (!publication.collaborators) {
        return resolve(publication);
      }

      let authors = _.filter(publication.collaborators, { role: 'author', status: 'CONFIRMED' });

      // Grab the user info for each collaborator
      authors = await Promise.all(authors.map((author) => new Promise((authorResolve) => {
        return api.getUserByORCiD(author.userID, (userErr, userData) => {
          if (userErr) {
            authorResolve();
          }
          // We're only interested in the name and the orcid
          const { name, orcid } = userData;
          authorResolve({ name, orcid });
        });
      })));

      // Filter our undefined entries
      authors = authors.filter((author) => author);

      return resolve({ ...publication, authors });
    })));

    res.locals.publications = {
      totalCount: data && data.total ? data.total : 0,
      displayedCount: data && data.results ? data.results.length : 0,
      results,
    };

    return res.render('publications/search', res.locals);
  });
};
