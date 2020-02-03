const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const relatedPublicationID = req.params.relatedPublicationID;
  const rating = req.params.rating;
  const userId = _.get(req, 'session.user.orcid');

  console.log('publicationID', publicationID);
  console.log('relatedPublicationID', relatedPublicationID);

  debug('octopus:ui:debug')(`Saving a related publication for ${publicationID}`);

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get Publication data by ID
  return api.getPublicationByID(relatedPublicationID, (publicationErr, publicationData) => {
    if (publicationErr || !publicationData) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${relatedPublicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    // Get current publication ratings
    const { relatedPublications } = publicationData;
    const foundRelatedPublication = relatedPublications.filter((relatedPub) => relatedPub.publicationID == publicationID)[0]
    const newRating = { userId, rating };
    let values = [];

    // Insert new rating
    foundRelatedPublication.ratings.push(newRating);

    // Calculate total rating
    foundRelatedPublication.ratings.forEach((pubRating) => {
      values.push(parseFloat(pubRating.rating));
    })

    const sum = values.reduce((a, b) => a + b, 0);
    const total = values.length;

    foundRelatedPublication.rating = Math.round(sum / total);

    // Update publication object
    return api.updatePublication(publicationData, (updateErr, updateData) => {
      if (updateErr || !updateData) {
        return res.render('publish/error', { error: updateErr });
      }

      return res.redirect(`/publications/view/${publicationID}`);
    });
  });
};
