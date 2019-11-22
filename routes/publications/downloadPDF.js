const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const { publicationID } = req.params;

  debug('octopus:ui:debug')(`Downloading Publication ${publicationID}`);

  return api.downloadPublicationPDF(
    publicationID,
    async (publicationErr, publicationPDF) => {
      if (publicationErr || !publicationPDF) {
        debug('octopus:ui:error')(
          `Error when trying to download Publication ${publicationID}: ${publicationErr}`
        );
        return res.render('publications/error');
      }
      console.log('publicationPDF', publicationPDF);
      // debug('octopus:ui:trace')(res.locals);
      return res.send('haatz');
      return res.render('publications/view', res.locals);
    }
  );
};
