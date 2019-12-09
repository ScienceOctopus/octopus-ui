const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');

module.exports = (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');
  const userId = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Rating Publication ${publicationID}`);

  // Cannot rate if you're not logged in
  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  return formHelpers.parseForm(req, (err, fields) => {
    let ratings = [fields.rating0, fields.rating1, fields.rating2];

    return api.getPublicationByID(publicationID, (publicationErr, publication) => {
      if (publicationErr || !publication) {
        debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
        return res.render('publications/error');
      }

      ratings = {
        ...publication.ratings,
        [userId]: ratings.map((r) => parseInt(r, 10)),
      };

      const publicationData = { _id: publicationID, ratings };

      return api.updatePublication(publicationData, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publish/error', { error: updateErr });
        }

        return res.redirect(`/publications/view/${publicationID}`);
      });
    });
  });
};
