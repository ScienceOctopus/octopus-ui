const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const { publicationTypes } = res.locals;

  debug('octopus:ui:debug')(`Showing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publication) => {
    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    if (publication.status === 'DRAFT') {
      // TODO check if user is on the list of collaborators - otherwise error / a new "not-yet-published" screen
      req.flash('info', 'This publication has still not been published. Redirecting to edit mode.');
      return res.redirect(`/publications/edit/${publicationID}`);
    }

    // Augment the publications with the author data
    if (publication.authors) {
      let authors = _.filter(publication.authors, { role: 'author', status: 'CONFIRMED' });

      // Grab the user info for each collaborator
      authors = await Promise.all(authors.map((author) => new Promise((resolve) => {
        return api.getUserByORCiD(author.userID, (userErr, userData) => {
          if (userErr) {
            resolve();
          }
          // We're only interested in the name and the orcid
          const { name, orcid } = userData;
          resolve({ name, orcid });
        });
      })));

      // Filter our undefined entries
      authors = authors.filter((author) => author);

      publication.authors = authors;
    }

    const pubType = publicationTypes.filter((type) => type.key === publication.type)[0];

    res.locals.publication = publication;
    res.locals.customTitleTag = `${pubType.title}: ${publication.title} - Octopus`;

    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/view', res.locals);
  });
};
