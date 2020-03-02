const api = require('../../lib/api');

// GET Resolution by resolutionID
const getResolutionByID = (resolutionID) => {
  return new Promise((resolve) => {
    return api.getResolutionByID(
      resolutionID,
      (resolutionErr, resolutionData) => resolve(resolutionData),
    );
  });
};

module.exports = {
  getResolutionByID,
};
