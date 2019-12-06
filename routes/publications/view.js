const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const orcid = require('../../lib/orcid.js');

module.exports = (req, res) => {
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const publicationID = req.params.publicationID;
  const { publicationTypes } = res.locals;

  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publicationData) => {
    const publication = { ...publicationData };

    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // Augment the publications with the author data
    if (publication.collaborators) {
      let authors = _.filter(publication.collaborators, { status: 'CONFIRMED' });

      // Grab the user info for each collaborator
      authors = await Promise.all(authors.map((author) => new Promise((resolve) => {
        return api.getUserByORCiD(author.userID, (userErr, userData) => {
          if (userErr) {
            debug('octopus:ui:trace')(`Failed finding user ${author.userID}`);
          }

          // We have it in our db
          if (userData) {
            return resolve({
              name: userData.name,
              orcid: userData.orcid,
            });
          }

          // Look for it on orcid
          return orcid.getPersonDetails(author.userID, accessToken, (orcidError, orcidUser) => {
            if (orcidError) {
              return resolve();
            }

            if (orcidUser) {
              const firstName = _.get(orcidUser, 'name.given-names.value', '');
              const lastName = _.get(orcidUser, 'name.family-name.value', '');
              return resolve({
                name: `${firstName} ${lastName}`,
                orcid: author.userID,
              });
            }

            return resolve();
          });
        });
      })));

      // Filter our undefined entries
      authors = authors.filter((author) => author);

      publication.collaborators = authors;
    }

    const pubType = publicationTypes.filter((type) => type.key === publication.type)[0];

    res.locals.publication = publication;
    res.locals.customTitleTag = `${pubType.title}: ${publication.title} - Octopus`;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/view', res.locals);
  });
};
