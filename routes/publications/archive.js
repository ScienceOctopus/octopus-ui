const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');

  debug('octopus:ui:debug')(`Archiving Publication ${publicationID}`);

  // Cannot archive if you're not logged in
  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get the current publication by id
  // Insert it in the revisions collection with { parentId: _id }
  // Update the current revision property ++
  return api.getPublicationByID(publicationID, (publicationErr, publicationData) => {
    if (publicationErr || !publicationData) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // Achive the current publication
    const archive = _.omit({ ...publicationData, publicationID, status: 'ARCHIVE' }, '_id');
    return api.createArchive(archive, (archiveErr, archiveData) => {
      if (archiveErr || !archiveData) {
        debug('octopus:ui:error')(`Error when trying to create Archive ${publicationID}: ${archiveErr}`);
        return res.render('publications/error');
      }

      const updatedPublication = {
        _id: publicationID,
        revision: parseInt(publicationData.revision, 10) + 1,
        dateCreated: new Date(),
        dateLastActivity: new Date(),
        status: 'DRAFT',
        ratings: [],
      };

      return api.updatePublication(updatedPublication, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publications/error');
        }

        return res.redirect(`/publications/edit/${publicationID}`);
      });
    });
  });
};
