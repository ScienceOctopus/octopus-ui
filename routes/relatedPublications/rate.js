const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const helpers = require('./helpers');

module.exports = async (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');
  const relatedPublicationID = _.get(req, 'params.relatedPublicationID');
  const incomingRating = _.get(req, 'params.rating');
  const userId = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Saving a related publication for ${publicationID}`);

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get Related Publication data by ID
  const relatedPublication = await helpers.getSpecificRelatedPub(
    publicationID,
    relatedPublicationID,
  );
  const { ratings } = relatedPublication;

  // Check if user already rated
  const userAlredyRated = ratings.some(
    (rating) => rating.createdByUser === userId,
  );

  if (!userAlredyRated) {
    const newRating = {
      createdByUser: userId,
      rating: incomingRating,
      dateCreated: new Date(),
    };

    relatedPublication.ratings.push(newRating);

    // Update publication object
    return api.updateRelatedPublication(
      relatedPublication,
      (updateErr, updateData) => {
        if (updateErr || !updateData) {
          return res.render('publish/error', { error: updateErr });
        }

        return res.redirect(
          `/publications/view/${publicationID}/?related=${relatedPublicationID}`,
        );
      },
    );
  }

  return res.render('publish/error', {
    error: 'You already rated this Related publication',
  });
};
