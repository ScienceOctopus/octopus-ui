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

// TODO: after the function was created import it in /routes/publications/save.js
// Returns data for the collaborators that doesn't exists in our DB
async function checkForNewUsers(orcidIds, accessToken) {
  // Check which author already exists in our DB
  const authors = await Promise.all(orcidIds.map(async (orcidId) => {
    const userAlredyExists = await new Promise((resolve) => api.getUserByORCiD(orcidId, (getAuthorErr, getAuthorData) => {
      if (getAuthorErr || !getAuthorData) {
        return resolve(false);
      }

      return resolve(true);
    }));

    if (!userAlredyExists) {
      return orcidId;
    }

    return null;
  }));

  // New users that needs to be inserted in DB
  const newAuthors = authors.filter((author) => !_.isEmpty(author));

  // Create user object to insert in DB
  const newAuthorsList = await Promise.all(newAuthors.map(async (newAuthor) => {
    // Get all user data from ORCiD api using ORCiDid
    const userData = await new Promise((resolve) => {
      return orcidApi.getPersonDetails(newAuthor, accessToken, (getPersonDetailsErr, getPersonDetailsData) => {
        if (getPersonDetailsErr || _.isEmpty(getPersonDetailsData)) {
          return resolve(null);
        }

        const { name } = getPersonDetailsData;

        const firstName = name['family-name'] ? name['family-name'].value : '';
        const lastName = name['given-names'] ? name['given-names'].value : '';
        const fullName = `${firstName} ${lastName}`;

        return resolve({ name: fullName });
      });
    });

    // Create user object to insert in DB
    userData.email = null;
    userData.orcid = newAuthor;
    userData.dateCreated = new Date();
    userData.dateLastActivity = new Date();
    userData.userGroup = 1;

    return userData;
  }));

  return newAuthorsList;
}

module.exports = {
  getOrchidUserFullName,
  findUserByOrcid,
  insertManyUsers,
  checkForNewUsers,
};
