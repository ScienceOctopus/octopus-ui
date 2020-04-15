const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');
const userHelpers = require('../users/helpers');

function mapResultForDropdown(result) {
  return {
    // eslint-disable-next-line no-underscore-dangle
    id: result._id,
    title: result.title,
    type: result.type,
  };
}

module.exports = (req, res) => {
  const publicationID = req.params.publicationID;
  const accessToken = _.get(req, 'session.authOrcid.accessToken');
  debug('octopus:ui:debug')(`Editing Publication ${publicationID}`);

  return api.getPublicationByID(publicationID, async (publicationErr, publicationData) => {
    const publication = { ...publicationData };

    if (publicationErr || !publication) {
      debug('octopus:ui:error')(`Error when trying to load Publication ${publicationID}: ${publicationErr}`);
      return res.render('publications/error');
    }

    if (publication.status !== 'DRAFT') {
      req.flash('info', 'This publication has already been published. Redirecting to view mode.');
      return res.redirect(`/publications/view/${publicationID}`);
    }

    res.locals.publication = publication;
    res.locals.customTitleTag = `Edit ${publication.title}`;

    const publicationTypeDef = _.find(res.locals.publicationTypes, { key: res.locals.publication.type });

    if (publication.collaborators) {
      let authors = publication.collaborators;
      // Augment authors list
      authors = await Promise.all(authors.map((author) => userHelpers.findUserByID(author.userID, accessToken)));
      // Filter our undefined entries
      authors = authors.filter((author) => author);

      publication.authors = authors;
    }

    // Attach linked and linkable publications
    const { linkedPublications = [] } = publication;
    const allLinkablePublications = [];

    if (publicationTypeDef.linksTo === '*') {
      const linkablePublications = await new Promise((resolve) => api.findPublications({}, (linkablePublicationsErr, linkablePublicationsData) => resolve(linkablePublicationsData.results)));
      linkablePublications.forEach((linkablePublication) => allLinkablePublications.push(mapResultForDropdown(linkablePublication)));
    } else {
      const dd = await Promise.all(publicationTypeDef.linksTo.map(async (linkType) => {
        const filters = {
          type: linkType,
        };

        const linkablePublications = await new Promise((resolve) => api.findPublications(filters, (linkablePublicationsErr, linkablePublicationsData) => resolve(linkablePublicationsData.results)));
        linkablePublications.forEach((linkablePublication) => allLinkablePublications.push(mapResultForDropdown(linkablePublication)));
      }));
    }

    const notLinkedPublications = allLinkablePublications.filter((linkablePublication) => {
      return !linkedPublications.includes(linkablePublication.id);
    });

    const alreadyLinkedPublications = allLinkablePublications.filter((linkablePublication) => {
      return linkedPublications.includes(linkablePublication.id);
    });

    publication.alreadyLinkedPublications = alreadyLinkedPublications;
    publication.notLinkedPublications = notLinkedPublications;
    // debug('octopus:ui:trace')(res.locals);
    return res.render('publications/edit', res.locals);
  });
};
