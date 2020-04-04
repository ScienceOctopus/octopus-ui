const _ = require('lodash');
const debug = require('debug');

const api = require('../../../lib/api');
const helpers = require('./helpers');
const formHelpers = require('../../../lib/form');
const userHelpers = require('../../users/helpers');

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
  const accessToken = _.get(req, 'session.authOrcid.accessToken');

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

  return formHelpers.parseForm(req, async (err, fields, files) => {
    const fileData = _.first(files);
    const { relatedPublications } = fields;
    const data = { ...fields, userId: req.session.user.orcid };
    const publicationFormState = helpers.aggregatePublicationFormState(data);

    debug('octopus:ui:trace')(`Step ${stepNumber}, publication ${publicationFormState}`);

    res.locals.publishStepNumber = stepNumber;
    res.locals.publication = publicationFormState;
    res.locals.linkedPublicationId = query.linked;
    res.locals.relatedPublications = relatedPublications;

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
      const linkedPublicationId = res.locals.linkedPublicationId;
      const publicationTypeDef = _.find(res.locals.publicationTypes, { key: res.locals.publication.type });
      const filters = {};

      if (linkedPublicationId) {
        const linkedPublicationData = await new Promise((resolve) => api.getPublicationByID(linkedPublicationId, (linkedPubErr, linkedPubData) => {
          return resolve({
            title: linkedPubData.title,
            type: linkedPubData.type,
          });
        }));

        res.locals.linkedPublicationData = linkedPublicationData;
      }

      return api.findPublications(filters, (publicationsErr, pubData) => {
        // Filter publications based on property linksTo
        const linkablePublications = pubData && pubData.results ? pubData.results.filter((result) => {
          if (publicationTypeDef.linksTo[0] !== '*') {
            return result.type === publicationTypeDef.linksTo[0];
          }

          return result;
        }) : [];

        const allLinkablePublications = linkablePublications ? _.map(linkablePublications, mapResultForDropdown) : [];
        res.locals.linkableApplicationsText = _.uniqBy(allLinkablePublications, (p) => p.type);
        res.locals.allLinkablePublications = allLinkablePublications;

        const relatablePublications = pubData && pubData.results ? pubData.results : [];
        const allRelatablePublications = relatablePublications ? _.map(relatablePublications, mapResultForDropdown) : [];
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

    if (publicationFormState.collaborators && publicationFormState.collaborators.length > 1) {
      const { collaborators } = publicationFormState;

      // Returns data for the collaborators that doesn't exists in our DB
      const newAuthorsList = await new Promise((resolve) => resolve(userHelpers.checkForNewUsers(collaborators, accessToken)));

      // Insert New Users List in DB
      await userHelpers.insertManyUsers(newAuthorsList, res);
    }

    return res.render(`publish/steps/step-${stepNumber}`, res.locals);
  });
};
