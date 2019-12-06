const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid');

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

    // Augment the publications with the author data
    results = await Promise.all(results.map((publication) => new Promise((resolve) => {
      if (!publication.collaborators) {
        return resolve(publication);
      }

      let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });

      // Grab the user info for each collaborator
      return (async () => {
        authors = await Promise.all(authors.map((author) => new Promise((authorResolve) => {
          return api.getUserByORCiD(author.userID, (userErr, userData) => {
            if (userErr) {
              debug('octopus:ui:trace')(`Failed finding user ${author.userID}`);
            }

            // We have it in our db
            if (userData) {
              return authorResolve({
                name: userData.name,
                orcid: userData.orcid,
              });
            }

            // Look for it on orcid
            return orcid.getPersonDetails(author.userID, accessToken, (orcidError, orcidUser) => {
              if (orcidError) {
                return authorResolve();
              }

              if (orcidUser) {
                const firstName = _.get(orcidUser, 'name.given-names.value', '');
                const lastName = _.get(orcidUser, 'name.family-name.value', '');
                return authorResolve({
                  name: `${firstName} ${lastName}`,
                  orcid: author.userID,
                });
              }

              return authorResolve();
            });
          });
        })));

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
