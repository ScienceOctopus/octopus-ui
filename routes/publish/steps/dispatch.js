const _ = require('lodash');
const debug = require('debug');

module.exports = (req, res) => {
  const stepNumber = Number(req.params.stepNumber);
  debug('octopus:ui:debug')(`Showing Publish step ${stepNumber}`);
  // debug('octopus:ui:debug')(`Submitted information:\n ${JSON.stringify(req.body, null, 2)}`);

  // if not logged in redirect to /users/login with a flash message

  // if wrong step redirect to error page
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    res.locals.error = new Error(`Step "${stepNumber}" not found.`);
    return res.render('publish/error', res.locals);
  }

  const publicationState = {
    publicationType: req.body.publicationType,
    linkedPublications: req.body.linkedPublications,
    publicationTitle: req.body.publicationTitle,
    publicationSummary: req.body.publicationSummary,
    publicationKeywords: req.body.publicationKeywords,
    collaborators: req.body.collaborators,
    fundingStatement: req.body.fundingStatement,
    coiDeclaration: req.body.coiDeclaration,
    publicationFile: req.body.publicationFile,
  };

  res.locals.publishStepNumber = stepNumber;
  res.locals.publication = publicationState;

  debug('octopus:ui:trace')(res.locals);

  return res.render(`publish/steps/step-${stepNumber}`, res.locals);
};
