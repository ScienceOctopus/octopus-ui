const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const helpers = require('../publish/steps/helpers');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const publicationData = _.merge({}, req.body, { _id: publicationID, status: 'LIVE' });

  debug('octopus:ui:debug')(`Publishing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, (publicationErr, publication) => {
    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    if (publication.status !== 'DRAFT') {
      // TODO check if user is on the list of collaborators - otherwise error / a new "not-yet-published" screen
      req.flash('info', 'You can only publish drafts.');
      return res.redirect(`/publications/view/${publicationID}`);
    }

    return helpers.parseForm(req, (err, fields, files) => {
      if (err) {
        return res.render('publish/error', { error: err });
      }

      debug('octopus:ui:trace')(fields, files);

      // update publication object
      return api.updatePublication(publicationData, (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publish/error', { error: updateErr });
        }

        return res.redirect(`/publications/view/${publicationID}`);
      });
    });
  });
};
