const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const { publicationID } = req.params;

  debug('octopus:ui:debug')(`Downloading Publication ${publicationID}`);

  return api.downloadPublicationPDF(
    publicationID,
    async (publicationErr, publicationPDFBuffer) => {
      if (publicationErr || !publicationPDFBuffer) {
        debug('octopus:ui:error')(
          `Error when trying to download Publication ${publicationID}: ${publicationErr}`
        );
        return res.render('publications/error');
      }

      const publicationPDF = Buffer.from(publicationPDFBuffer);

      res.setHeader('Content-disposition', `attachment; filename=${publicationID}.pdf`);
      res.end(publicationPDF, '');
    }
  );
};
