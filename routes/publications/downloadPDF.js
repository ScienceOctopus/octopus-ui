const debug = require('debug');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const { publicationID } = req.params;
  const baseUrl = req.get('host');

  debug('octopus:ui:debug')(`Downloading Publication ${publicationID}`);
  return api.downloadPublicationPDF(
    publicationID,
    baseUrl,
    async (publicationErr, publicationPDFBuffer) => {
      if (publicationErr || !publicationPDFBuffer) {
        debug('octopus:ui:error')(
          `Error when trying to download Publication ${publicationID}: ${publicationErr}`,
        );
      }

      const publicationPDF = Buffer.from(publicationPDFBuffer);

      res.setHeader(
        'Content-disposition',
        `attachment; filename=${publicationID}.pdf`,
      );
      res.end(publicationPDF, '');
    },
  );
};
