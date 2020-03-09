const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const helpers = require('./helpers');

module.exports = async (req, res) => {
  const resolutionID = _.get(req, 'params.resolutionID');

  debug('octopus:ui:debug')(`Updating a resolutio publication for ${resolutionID}`);

  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get Resolution data
  const resolution = await helpers.getResolutionByID(resolutionID);
  resolution.status = 'RESOLVED';

  // Update Resolution Object
  return api.updateResolution(resolution, (updateErr, updateData) => {
    if (updateErr || !updateData) {
      return res.render('publish/error', { error: updateErr });
    }

    return res.redirect(`/resolution-center/${resolutionID}`);
  });
};
