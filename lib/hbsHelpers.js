const _ = require('lodash');

function json(input) {
  return JSON.stringify(input, null, 2);
}

function roundNumber(input, places) {
  // eslint-disable-next-line no-restricted-globals
  const decPlaces = !isNaN(Number(places)) ? Number(places) : 0;
  const decFactor = 10 ** decPlaces;

  return Math.round(input * decFactor) / decFactor;
}

function markHits(text, needle) {
  if (typeof needle !== 'string' || !needle.trim().length) {
    return text;
  }

  const pattern = new RegExp(needle, 'gi');
  const replacement = (hit) => `<span class="hit">${hit}</span>`;
  const newText = text.replace(pattern, replacement);

  return newText;
}

function formatDate(date) {
  const parsedDate = new Date(date);

  let rtn = '';
  rtn += _.padStart(parsedDate.getFullYear(), 2, '0') + '/';
  rtn += _.padStart(parsedDate.getMonth(), 2, '0') + '/';
  rtn += _.padStart(parsedDate.getDate(), 2, '0');
  return rtn;
}

function isEqual(var1, var2) {
  // eslint-disable-next-line
  return var1 == var2;
}

module.exports = {
  json,
  roundNumber,
  markHits,
  formatDate,
  isEqual,
};
