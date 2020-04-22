const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const { publicationID } = req.params;
  const baseUrl = req.get('host');

  debug('octopus:ui:debug')(`Downloading Publication ${publicationID}`);
  return api.downloadPublicationPDF(
    publicationID,
    baseUrl,
    async (publicationErr, publicationPDFResponse) => {},
  ).pipe(res);
};
