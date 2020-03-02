const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

module.exports = (req, res) => {
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  const resolutionID = _.get(req, 'params.resolutionID');

  debug('octopus:ui:debug')(`Showing a red flag for ${resolutionID}`);

  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publications/error', res.locals);
  }

  return api.getResolutionByID(
    resolutionID,
    async (resolutionErr, resolutionResult) => {
      if (resolutionErr || !resolutionResult) {
        return res.render('publications/error');
      }

      const resolution = { ...resolutionResult };
      const { publicationID } = resolution;

      // Attach publication Data
      const publicationData = await new Promise((resolve) => api.getPublicationByID(publicationID, (pubErr, pubData) => resolve(pubData)));
      resolution.publicationTitle = publicationData.title;
      resolution.publicationAuthor = publicationData.createdByUser;

      // Attach comment author name
      resolution.comments = await Promise.all(resolution.comments.map((comment) => new Promise(async (resolve) => {
        const { userID } = comment;
        const userData = await userHelpers.findUserByOrcid(userID, accessToken);
        return resolve({ ...comment, userName: userData.name });
      })));

      res.locals.resolution = resolution;
      debug('octopus:ui:trace')(res.locals);

      return res.render('resolution-center', res.locals);
    },
  );
};
