const debug = require('debug');

module.exports = (req, res) => {
  debug('octopus:ui:debug')(`Saving a publication`);

  const pubID = 'publication-id';
  // debug('octopus:ui:trace')(res.locals);
  return res.redirect(`/publications/view/${pubID}`);
  // return res.redirect(`/publish/edit/${pubID}`);
};
