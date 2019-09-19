const debug = require('debug');

module.exports = (req, res) => {
  const stepNumber = Number(req.params.stepNumber);
  debug('octopus:ui:debug')(`Showing Publish step ${stepNumber}`);

  // if not logged in redirect to /users/login with a flash message

  // if wrong step redirect to error page
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 3) {
    res.locals.error = new Error(`Step "${stepNumber}" not found.`);
    return res.render('publish/error', res.locals);
  }

  res.locals.publishStepNumber = stepNumber;
  // debug('octopus:ui:trace')(res.locals);
  return res.render(`publish/steps/step-${stepNumber}`, res.locals);
};
