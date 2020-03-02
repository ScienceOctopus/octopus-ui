const _ = require('lodash');
const debug = require('debug');

const api = require('../../lib/api');
const formHelpers = require('../../lib/form');

module.exports = async (req, res) => {
  const publicationID = _.get(req, 'params.publicationID');
  const userId = _.get(req, 'session.user.orcid');

  debug('octopus:ui:debug')(`Saving a related publication for ${publicationID}`);

  if (!req.session.user) {
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  // Get data from form
  return formHelpers.parseForm(req, async (err, fields, files) => {
    if (err) {
      return res.render('publish/error', { error: err });
    }

    debug('octopus:ui:trace')(fields, files);

    const { reason, description } = fields;

    // New red flagged publication object
    const newRedFlaggedPublication = {
      publicationID,
      reason,
      description,
      status: 'OPEN',
      comments: [],
      createdByUser: userId,
      dateCreated: new Date(),
    };

    return api.redFlagPublication(
      newRedFlaggedPublication,
      (redFlagPubErr, redFlagPubResult) => {
        if (redFlagPubErr || !redFlagPubResult || !redFlagPubResult.insertedId) {
          return res.render('publications/error');
        }

        return res.redirect(`/publications/view/${publicationID}`);
      },
    );
  });
};
