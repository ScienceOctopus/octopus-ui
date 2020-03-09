const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');
const helpers = require('./helpers');
const publishHelpers = require('../publish/steps/helpers');

const uploadFile = (fileData) => new Promise((resolve) => {
  return publishHelpers.handleFileUpload(fileData, (uploadErr, uploadResult) => {
    if (uploadErr) {
      return resolve(null);
    }

    return resolve(uploadResult);
  });
});

module.exports = async (req, res) => {
  const resolutionID = _.get(req, 'params.resolutionID');
  const userID = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Updating a resolutio publication for ${resolutionID}`);

  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get data from form
  return formHelpers.parseForm(req, async (err, fields, files) => {
    if (err) {
      return res.render('publish/error', { error: err });
    }

    const fileData = _.first(files);

    debug('octopus:ui:trace')(fields, files);
    const { text } = fields;

    // New Comment Object
    const newComment = {
      userID,
      text,
      dateCreated: new Date(),
    };

    const resolution = await helpers.getResolutionByID(resolutionID);
    const { comments } = resolution;

    if (!_.isEmpty(fileData)) {
      const uploadResult = await uploadFile(fileData);

      if (!_.isEmpty(uploadResult)) {
        newComment.fileName = fileData.filename;
        newComment.fileId = uploadResult._id;
      }
    }

    comments.push(newComment);

    // Update Resolution Object
    return api.updateResolution(resolution, (updateErr, updateData) => {
      if (updateErr || !updateData) {
        return res.render('publish/error', { error: updateErr });
      }

      return res.redirect(`/resolution-center/${resolutionID}`);
    });
  });
};
