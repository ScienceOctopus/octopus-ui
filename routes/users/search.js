const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');

// Hash maps of the user details
// This will help us when we're requesting the same data (E.g. changing filters)
const userDataCache = {};

const findUser = (result) => new Promise((resolve) => {
  const orcid = result['orcid-identifier'].path;

  // Check if the result is cached & return that
  if (userDataCache[orcid]) {
    return resolve(userDataCache[orcid]);
  }

  // Otherwise, search for it
  return api.findORCiDUser(orcid, (userErr, userData) => {
    // Cache it
    if (userData) {
      userDataCache[orcid] = userData;
    }
    // Return it
    resolve(userData);
  });
});

module.exports = (req, res) => {
  const query = {
    phrase: _.get(req, 'query.phrase'),
    sort: _.get(req, 'query.sort'),
  };

  debug('octopus:ui:debug')(`Searching for Users. Query: "${query.phrase || ''}"`);

  return api.searchORCiDUsers(query.phrase, async (usersErr, usersData) => {
    const data = usersData;

    res.locals.query = query;

    // Results back from orcid
    let results = data.result || [];

    // Find user details for each result we got back
    results = await Promise.all(results.map(findUser));

    // Filter out falsy entries
    results = results.filter((result) => result);

    // Sort them
    results = results.sort((a, b) => {
      const userNameA = _.get(a, 'name.given-names.value') + ' ' + _.get(a, 'name.family-name.value');
      const userNameB = _.get(b, 'name.given-names.value') + ' ' + _.get(b, 'name.family-name.value');

      switch (query.sort) {
        case 'name-desc': return userNameB.localeCompare(userNameA);
        case 'name-asc':
        default: return userNameA.localeCompare(userNameB);
      }
    });

    res.locals.users = {
      totalCount: data && data['num-found'] ? data['num-found'] : 0,
      displayedCount: data && data.result ? data.result.length : 0,
      results,
    };

    return res.render('users/search', res.locals);
  });
};
