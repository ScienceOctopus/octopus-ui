const debug = require('debug');
const api = require('../../../lib/api');

module.exports = (req, res) => {
  debug('octopus:ui:debug')(`Saving a publication`);

  const newPublication = {
    status: 'DRAFT',
    revision: 1,
    createdByUser: 1,
    dateCreated: new Date(),
    dateLastActivity: new Date(),

    type: req.body.publicationType,
    parentProblems: [],
    parentPublications: [req.body.linkedPublications],
    title: req.body.publicationTitle,
    summary: req.body.publicationSummary,
    text: '',
    keywords: [req.body.publicationKeywords],
    collaborators: req.body.collaborators,
    fundingStatement: req.body.fundingStatement,
    coiDeclaration: req.body.coiDeclaration,
    publicationFiles: [req.body.publicationFile],
  };

  // debug('octopus:ui:trace')(res.locals);

  api.createPublication(newPublication, (err, data) => {
    if (err || !data || !data.insertedId) {
      return res.render('publish/error', { error: err });
    }
    // eslint-disable-next-line
    return res.redirect(`/publications/view/${data.insertedId}`);
  });
};
