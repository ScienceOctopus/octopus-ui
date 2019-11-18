const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid');

// Hash maps of the user details
// This will help us when we're requesting details for the same users
const userDetailsCache = {};

/* Returns the user details based on a OrcID search result */
const findUser = (result, accessToken) => new Promise((resolve) => {
  const userOrcID = result['orcid-identifier'].path;

  // Check if the result is cached & return that
  if (userDetailsCache[userOrcID]) {
    return resolve(userDetailsCache[userOrcID]);
  }

  // Otherwise, search for it
  return orcid.getPersonDetails(userOrcID, null, (userErr, userData) => {
    // Cache it
    if (userData) {
      userDetailsCache[userOrcID] = userData;
    }
    // Return it
    resolve(userData);
  });
});

/* Filters out users based on the phase and filter type */
const filterUser = (query, result) => {
  if (!result) {
    return false;
  }

  if (!query.phrase) {
    return true;
  }

  const userFirstName = _.get(result, 'name.given-names.value') || '';
  const userLastName = _.get(result, 'name.family-name.value') || '';
  const queryPhase = query.phrase.toLowerCase().trim();

  switch (query.filter) {
    case 'first-name': return userFirstName.toLowerCase().includes(queryPhase);
    case 'last-name': return userLastName.toLowerCase().includes(queryPhase);
    default: return true;
  }
};

/* Sort users based on the sort type */
const sortUsers = (query, a, b) => {
  const userNameA = _.get(a, 'name.given-names.value') + ' ' + _.get(a, 'name.family-name.value');
  const userNameB = _.get(b, 'name.given-names.value') + ' ' + _.get(b, 'name.family-name.value');

  switch (query.sort) {
    case 'name-asc': return userNameA.localeCompare(userNameB);
    case 'name-desc': return userNameB.localeCompare(userNameA);
    default: return 0;
  }
};

module.exports = (req, res) => {
  const query = {
    phrase: _.get(req, 'query.phrase'),
    filter: _.get(req, 'query.filter'),
    sort: _.get(req, 'query.sort'),
  };

  const accessToken = _.get(req, 'session.authOrcid.accessToken');

  debug('octopus:ui:debug')(`Searching for Users. Query: "${query.phrase || ''}"`);

  return orcid.search(query.phrase, accessToken, async (usersErr, usersData) => {
    const data = usersData;

    res.locals.query = query;

    // Results back from orcid
    let results = (data && data.result) || [];

    // Attach the user details for each result we got back
    results = await Promise.all(results.map((result) => findUser(result, accessToken)));

    // Filter them
    results = results.filter((result) => filterUser(query, result));

    // Sort them
    results = results.sort((a, b) => sortUsers(query, a, b));

    // Return them
    res.locals.users = {
      totalCount: data && data['num-found'] ? data['num-found'] : 0,
      displayedCount: data && data.result ? data.result.length : 0,
      results,
    };

    return res.render('users/search', res.locals);
  });
};
