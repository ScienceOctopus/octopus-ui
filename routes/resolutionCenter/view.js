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
    return res.render('publish/error', res.locals);
  }

  return api.getResolutionByID(
    resolutionID,
    async (resolutionErr, resolutionResult) => {
      if (resolutionErr || !resolutionResult) {
        return res.render('publish/error', { error: resolutionErr });
      }

      let { comments, publicationID } = resolutionResult;

      // Attach publication Data
      const publicationData = await new Promise(resolve => api.getPublicationByID(publicationID, (pubErr, pubData) => {
          if (pubData) {
            return resolve(pubData);
          }

          return resolve();
        })
      );

      resolutionResult.publicationTitle = publicationData.title;
      resolutionResult.publicationAuthor = publicationData.createdByUser;

      // Attach comment author name
      for (let i = 0; i < comments.length; i++) {
        const { userID } = comments[i];
        const userData = await new Promise(resolve => {
          const foundUserData = userHelpers.findUserByOrcid(
            userID,
            accessToken
          );
          return resolve(foundUserData);
        });

        comments[i].userName = userData.name;
      }

      res.locals.resolution = resolutionResult;
      debug('octopus:ui:trace')(res.locals);

      return res.render('resolution-center', res.locals);
    }
  );
};
