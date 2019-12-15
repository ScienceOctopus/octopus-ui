const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');

  debug('octopus:ui:debug')(`Reversioning Publication ${publicationID}`);

  // Cannot reversion if you're not logged in
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

    // Reversion the current publication
    const reversion = _.omit({ ...publicationData, publicationID, status: 'ARCHIVE' }, '_id');
    return api.createReversion(reversion, (reversionErr, reversionData) => {
      if (reversionErr || !reversionData) {
        debug('octopus:ui:error')(`Error when trying to create Reversion ${publicationID}: ${reversionErr}`);
        return res.render('publications/error');
      }

      // Update revision number
      const revision = publicationData.revision + 1;
      return api.updatePublication({ _id: publicationID, revision }, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publications/error');
        }

        return res.redirect(`/publications/view/${publicationID}`);
      });
    });
  });
};
