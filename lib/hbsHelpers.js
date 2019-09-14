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

module.exports = {
  json,
  roundNumber,
  markHits,
};
