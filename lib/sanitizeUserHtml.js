const sanitizeHtml = require('sanitize-html');

// reverse the escapeHtml method from sanitize-html module
function unescapeHtmlEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function stripOnEventAttributes(value) {
  return value.replace(/\s(on)\S*=*(\)|"|\\"|\\'|')(.*\)|"|\\"|\\'|)/gi, '');
}

function sanitizeUserHtml(value, opts) {
  const o = opts || { run: 0 };
  const val = value || '';
  o.run += 1;

  const sanitizerOpts = {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src'],
    },
  };

  const sanitisedValue = stripOnEventAttributes(sanitizeHtml(val, sanitizerOpts));
  const unescaped = unescapeHtmlEntities(sanitisedValue);

  // same value as input - can be safely returned
  if (value === unescaped) {
    return sanitisedValue;
  }

  if (opts.run > 10) {
    console.log('Couldn\'t sanitize the provided value. Returning empty string.');
    return '';
  }

  return sanitizeUserHtml(unescaped, opts);
}

module.exports = sanitizeUserHtml;
