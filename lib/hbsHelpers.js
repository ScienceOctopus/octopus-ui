const _ = require('lodash');
const moment = require('moment');

function json(input) {
  return JSON.stringify(input, null, 2);
}

function toString(input = '') {
  return input.toString();
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

  if (!text) {
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

/* Select helper - marks an option as selected */
function select(value, options) {
  const content = options.fn(this);
  const valAttr = `value="${value}"`;
  return content.replace(valAttr, valAttr + ' selected');
}

/* Radio helper - marks an radio checkbox as checked */
function radio(value, options) {
  const content = options.fn(this);
  const valAttr = `value="${value}"`;
  return content.replace(valAttr, valAttr + ' checked');
}

function times(n, options) {
  let acc = '';
  for (let i = 0; i < n; i += 1) {
    options.data.index = i;
    options.data.first = i === 0;
    options.data.pos = i + 1;
    options.data.last = i === (n - 1);
    acc += options.fn(this);
  }
  return acc;
}

function math(op, v1, v2) {
  switch (op) {
    case 'add': return +v1 + +v2;
    case 'sub': return +v1 - +v2;
    default: return 0;
  }
}

function get(collection, key) {
  return _.get(collection, key);
}

function checkRating(ratings, key, index, max, disabled) {
  if (!ratings || !ratings[key] || !disabled) {
    return '';
  }

  return max - ratings[key] >= index ? 'checked' : '';
}

function publicationTypesOptions(linksTo, options) {
  const content = options.fn(this);
  if (!linksTo || linksTo === '*') {
    return content;
  }

  const unacceptedValuesRegex = new RegExp(`value="((?!${linksTo.join('|')}).)*"`, 'gi');
  return content.replace(unacceptedValuesRegex, 'hidden disabled');
}

module.exports = {
  json,
  toString,
  roundNumber,
  markHits,
  formatDate,
  equals,
  contains,
  startsWith,
  endsWith,
  select,
  radio,
  times,
  math,
  get,
  checkRating,
  publicationTypesOptions,
};
