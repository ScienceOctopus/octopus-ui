const debug = require('debug');
const _ = require('lodash');

const api = require('../../lib/api');

module.exports = (req, res) => {
  const fileId = _.get(req, 'params.fileId');

  debug('octopus:ui:debug')(`Downloading File ${fileId}`);

  return api.getFile(fileId, (err, data) => {
    if (err) {
      console.log('err', err);
      return res.sendStatus(500);
    }

    res.writeHead(200, {
      'Content-Disposition': `attachment; filename="${data.filename}"`,
    });

    return api.getFileContents(fileId, () => {}).pipe(res);
  });
};
