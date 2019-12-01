const _ = require('lodash');
const debug = require('debug');
const helpers = require('./helpers');
const api = require('../../../lib/api');

function aggregatePublicationFormState(fields) {
  const publicationState = {
    userId: fields.userId,
    type: fields.publicationType,
    linkedPublications: fields.linkedPublications,
    collaborators: fields.publicationCollaborators,
    title: fields.publicationTitle,
    summary: fields.publicationSummary,
    dataLink: fields.publicationDataLink,
    ethicalPermissions: fields.ethicalPermissions,
    keywords: fields.publicationKeywords,
    fundingStatement: fields.fundingStatement,
    coiDeclaration: fields.coiDeclaration,
    carriedOut: fields.publicationCarriedOut,
    text: fields.publicationText
  };

  return publicationState;
}

function mapResultForDropdown(result) {
  return {
    // eslint-disable-next-line no-underscore-dangle
    id: result._id,
    title: result.title,
    type: result.type,
  };
}

module.exports = (req, res) => {
  const stepNumber = Number(req.params.stepNumber);
  debug('octopus:ui:debug')(`Showing Publish step ${stepNumber}`);

  // if wrong step redirect to error page
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 4) {
    res.locals.error = new Error(`Step "${stepNumber}" not found.`);
    return res.render('publish/error', res.locals);
  }

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  return helpers.parseForm(req, (err, fields, files) => {
    const data = { ...fields, userId: req.session.user.orcid };
    const publicationFormState = aggregatePublicationFormState(data);

    console.log(data);

    debug('octopus:ui:trace')(`Step ${stepNumber}, publication ${publicationFormState}`);
    res.locals.publishStepNumber = stepNumber;
    res.locals.publication = publicationFormState;
    debug('octopus:ui:trace')(res.locals);

    if (stepNumber === 2) {
      const publicationTypeDef = _.find(res.locals.publicationTypes, { key: res.locals.publication.type });

      const filters = {};
      if (publicationTypeDef.linksTo[0] !== '*') {
        filters.type = publicationTypeDef.linksTo[0];
      }

      return api.findPublications(filters, (publicationsErr, pubData) => {
        res.locals.allLinkablePublications = pubData && pubData.results ? _.map(pubData.results, mapResultForDropdown) : [];
        return res.render(`publish/steps/step-${stepNumber}`, res.locals);
      });
    }

    return res.render(`publish/steps/step-${stepNumber}`, res.locals);
  });
};
