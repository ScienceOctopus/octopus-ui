const _ = require('lodash');
const debug = require('debug');
const helpers = require('./helpers');
const formHelpers = require('../../../lib/form');
const api = require('../../../lib/api');

function mapResultForDropdown(result) {
  return {
    // eslint-disable-next-line no-underscore-dangle
    id: result._id,
    title: result.title,
    type: result.type,
  };
}

module.exports = (req, res) => {
  const query = {
    linked: _.get(req, 'query.linked'),
  };

  const stepNumber = Number(req.params.stepNumber);
  debug('octopus:ui:debug')(`Showing Publish step ${stepNumber}`);

  // if wrong step redirect to error page
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    res.locals.error = new Error(`Step "${stepNumber}" not found.`);
    res.locals.linked = query.linked;
    return res.render('publish/error', res.locals);
  }

  if (!req.session.user) {
    // TODO redirect to /users/login with a flash message
    res.locals.error = new Error('User not logged in.');
    return res.render('publish/error', res.locals);
  }

  return formHelpers.parseForm(req, (err, fields, files) => {
    const fileData = _.first(files);
    const data = { ...fields, userId: req.session.user.orcid };
    const publicationFormState = helpers.aggregatePublicationFormState(data);

    debug('octopus:ui:trace')(`Step ${stepNumber}, publication ${publicationFormState}`);
    res.locals.publishStepNumber = stepNumber;
    res.locals.publication = publicationFormState;
    res.locals.linkedPublicationId = query.linked;
    debug('octopus:ui:trace')(res.locals);

    if (stepNumber === 1 && query.linked) {
      const linkedPublicationId = res.locals.linkedPublicationId;
      return api.getPublicationByID(linkedPublicationId, (publicationErr, publicationData) => {
        const linkedPublicationType = _.find(res.locals.publicationTypes, { key: publicationData.type });
        res.locals.linksTo = linkedPublicationType.linksTo;
        return res.render(`publish/steps/step-${stepNumber}`, res.locals);
      });
    }

    if (stepNumber === 2) {
      const publicationTypeDef = _.find(res.locals.publicationTypes, { key: res.locals.publication.type });
      const filters = {};

      return api.findPublications(filters, (publicationsErr, pubData) => {
        // Filter publications based on property linksTo
        const linkablePublications = pubData && pubData.results ? pubData.results.filter(data => {
          if (publicationTypeDef.linksTo[0] !== '*') {
            return data.type === publicationTypeDef.linksTo[0];
          }

          return data;
        }) : [];

        const allLinkablePublications = linkablePublications ? _.map(linkablePublications, mapResultForDropdown) : [];
        res.locals.linkableApplicationsText = _.uniqBy(allLinkablePublications, (p) => p.type);
        res.locals.allLinkablePublications = allLinkablePublications;

        const relatablePublications = pubData && pubData.results ? pubData.results : [];
        const allRelatablePublications = relatablePublications ? _.map(relatablePublications, mapResultForDropdown) : [];
        res.locals.linkableApplicationsText = _.uniqBy(allRelatablePublications, (p) => p.type);
        res.locals.allRelatablePublications = allRelatablePublications;

        return res.render(`publish/steps/step-${stepNumber}`, res.locals);
      });
    }

    if (fileData) {
      return helpers.handleFileUpload(fileData, (uploadErr, uploadResult) => {
        if (uploadErr) {
          return res.send('ERROR');
        }

        res.locals.publication.text = _.get(uploadResult, 'text');
        res.locals.publication.publicationFileId = _.get(uploadResult, '_id');
        return res.render(`publish/steps/step-${stepNumber}`, res.locals);
      });
    }
    return res.render(`publish/steps/step-${stepNumber}`, res.locals);
  });
};
