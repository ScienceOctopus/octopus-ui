const _ = require('lodash');
const debug = require('debug');
const helpers = require('./helpers');

function aggregatePublicationFormState(fields) {
  const publicationState = {
    publicationType: fields.publicationType,
    linkedPublications: fields.linkedPublications,
    publicationTitle: fields.publicationTitle,
    publicationSummary: fields.publicationSummary,
    publicationKeywords: fields.publicationKeywords,
    collaborators: fields.collaborators,
    fundingStatement: fields.fundingStatement,
    coiDeclaration: fields.coiDeclaration,
    publicationFile: fields.publicationFile,
  };
  return publicationState;
}

module.exports = (req, res) => {
  const stepNumber = Number(req.params.stepNumber);
  debug('octopus:ui:debug')(`Showing Publish step ${stepNumber}`);

  // if wrong step redirect to error page
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    res.locals.error = new Error(`Step "${stepNumber}" not found.`);
    return res.render('publish/error', res.locals);
  }

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  return helpers.parseForm(req, (err, fields, files) => {
    const publicationFormState = aggregatePublicationFormState(fields);

    debug('octopus:ui:trace')(`Step ${stepNumber}, publication ${publicationFormState}`);
    res.locals.publishStepNumber = stepNumber;
    res.locals.publication = publicationFormState;
    debug('octopus:ui:trace')(res.locals);

    return res.render(`publish/steps/step-${stepNumber}`, res.locals);
  });
};
