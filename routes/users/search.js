const _ = require('lodash');
const debug = require('debug');

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

  const includeEmployments = async () => {
    const [userDetails, userEmployments] = await Promise.all([
      new Promise((detailsResolve) => orcid.getPersonDetails(userOrcID, accessToken, (userErr, userData) => detailsResolve(userData))),
      new Promise((employmentsResolve) => orcid.getPersonEmployments(userOrcID, accessToken, (userErr, userData) => employmentsResolve(userData))),
    ]);

    if (userDetails) {
      // Include the organization info
      const organization = _.get(userEmployments, ['affiliation-group', '0', 'summaries', '0', 'employment-summary', 'organization'], null);
      const user = { ...userDetails, organization };
      // Cache it
      userDetailsCache[userOrcID] = user;
      return resolve(user);
    }

    return resolve(userDetails);
  };

  return includeEmployments();
});

/* Sort users based on the sort type */
const sortUsers = (query, a, b) => {
  const userNameA = _.get(a, 'name.given-names.value') + ' ' + _.get(a, 'name.family-name.value');
  const userNameB = _.get(b, 'name.given-names.value') + ' ' + _.get(b, 'name.family-name.value');

  switch (query.sort) {
    case 'name-desc': return userNameB.localeCompare(userNameA);
    case 'name-asc':
    default: return userNameA.localeCompare(userNameB);
  }
};

const getOrcidQuery = (query) => {
  const { phrase, nameFilter, orgFilter } = query;
  let orcidQuery = '';

  if (!phrase) {
    return orcidQuery;
  }

  switch (nameFilter) {
    case 'first-name': orcidQuery = `given-names:${phrase}`; break;
    case 'last-name': orcidQuery = `family-name:${phrase}`; break;
    default: orcidQuery = `family-name:${phrase}+OR+given-names:${phrase}`;
  }

  if (orgFilter) {
    orcidQuery = `+AND+${orgFilter}`;
  }

  return orcidQuery;
};

module.exports = (req, res) => {
  const query = {
    json: _.get(req, 'query.json'),
    phrase: _.get(req, 'query.phrase'),
    nameFilter: _.get(req, 'query.name_filter'),
    orgFilter: _.get(req, 'query.org_filter'),
    sort: _.get(req, 'query.sort'),
  };

  const accessToken = _.get(req, 'session.authOrcid.accessToken');

  debug('octopus:ui:debug')(`Searching for Users. Query: "${query.phrase || ''}"`);

  const orcidQuery = getOrcidQuery(query);

  return orcid.search(orcidQuery, accessToken, async (usersErr, usersData) => {
    const data = usersData;

    res.locals.query = query;

    // Results back from orcid
    let results = (data && data.result) || [];

    // Attach the user details for each result we got back
    results = await Promise.all(results.map((result) => findUser(result, accessToken)));

    // Remove empty entries
    results = results.filter(_.identity);

    // Sort them
    results = results.sort((a, b) => sortUsers(query, a, b));

    // Return them
    res.locals.users = {
      totalCount: data && data['num-found'] ? data['num-found'] : 0,
      displayedCount: data && data.result ? data.result.length : 0,
      results,
    };

    res.locals.customTitleTag = 'Author Search';

    return query.json
      ? res.json(res.locals.users)
      : res.render('users/search', res.locals);
  });
};
