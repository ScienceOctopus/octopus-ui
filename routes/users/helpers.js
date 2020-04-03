const _ = require('lodash');
const api = require('../../lib/api');
const orcidApi = require('../../lib/orcid');

// Returns the full name based on a orcid user entity
const getOrchidUserFullName = (user) => {
  const firstName = _.get(user, 'name.given-names.value', '');
  const lastName = _.get(user, 'name.family-name.value', '');
  return `${firstName} ${lastName}`;
};

// Searches for a user in our db, with a fallback to orcid.
const findUserByOrcid = (orcid, accessToken) => {
  // Search for the user in db
  const findUserInDb = (id) => new Promise((resolve) => {
    return api.getUserByORCiD(id, (err, data) => (err ? resolve({ id }) : resolve({ id, data })));
  });
  // Search for the user on orchid
  const findUserInOrcid = ({ id, data: userData }) => new Promise((resolve) => {
    if (userData) {
      return resolve({ id, data: userData });
    }
    return orcidApi.getPersonDetails(id, accessToken, (err, data) => (err ? resolve() : resolve({ id, data, fromOrcid: true })));
  });
  // Map to a normalized format
  const mapUserDetails = ({ id, data, fromOrcid }) => new Promise((resolve) => {
    if (!data) {
      resolve();
    }
    return resolve({
      orcid: id,
      name: fromOrcid ? getOrchidUserFullName(data) : data.name,
    });
  });
  // Waterfall
  return findUserInDb(orcid)
    .then(findUserInOrcid)
    .then(mapUserDetails);
};

// Inserts multiple users in DB
function insertManyUsers(user, res) {
  api.insertManyUsers(user, (insertManyUsersErr, insertManyUsersResult) => {
    if (insertManyUsersErr) {
      return res.render('publish/error', { error: insertManyUsersErr });
    }

    return insertManyUsersResult;
  });
}

module.exports = {
  getOrchidUserFullName,
  findUserByOrcid,
  insertManyUsers,
};
