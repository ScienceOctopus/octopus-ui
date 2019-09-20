const moment = require('moment');

function json(input) {
  return JSON.stringify(input, null, 2);
}

/* Formatting */
function roundNumber(input, places) {
  // eslint-disable-next-line no-restricted-globals
  const decPlaces = !isNaN(Number(places)) ? Number(places) : 0;
  const decFactor = 10 ** decPlaces;

  return Math.round(input * decFactor) / decFactor;
}

function formatDate(date) {
  const parsedDate = new Date(date);
  return moment(parsedDate).format('Do MMMM YYYY, HH:mm:ss');
}

/* Enrich text */
function markHits(text, needle) {
  if (typeof needle !== 'string' || !needle.trim().length) {
    return text;
  }

  const pattern = new RegExp(needle, 'gi');
  const replacement = (hit) => `<span class="text-hit">${hit}</span>`;
  const newText = text.replace(pattern, replacement);

  return newText;
}

/* Comparison functions */
function equals(var1, var2) {
  // eslint-disable-next-line
  return var1 == var2;
}

function contains(var1, var2) {
  return var1.indexOf(var2) !== -1;
}

function startsWith(var1, var2) {
  return var1.startsWith(var2);
}

function endsWith(var1, var2) {
  return var1.endsWith(var2);
}

module.exports = {
  json,
  roundNumber,
  markHits,
  formatDate,
  equals,
  contains,
  startsWith,
  endsWith,
};
