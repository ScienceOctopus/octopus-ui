const debug = require('debug');

module.exports = (req, res) => {
  const stepID = Number(req.params.step);
  debug('octopus:ui:debug')(`Showing Publish step ${stepID}`);

  res.locals.error = 'Step not found';

  // debug('octopus:ui:trace')(res.locals);
  return res.render('publish/error', res.locals);
};
