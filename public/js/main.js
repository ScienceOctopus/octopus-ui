(() => {
  const OctopusAppState = {
    pubChainVisibility: true,
  };

  const OctopusAppElements = {};

  // function autofocusSearch() {
  //   $('input#mainSearchInput').focus();
  // }

  function enableTooltips() {
    $('[data-toggle="tooltip"]').tooltip();
  }

  function togglePubChainVisibility() {
    console.log('togglePubChainVisibility');

    if (OctopusAppState.pubChainVisibility) {
      OctopusAppElements.$pubChainContainer.addClass('minimised');
      $('.fa.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
      OctopusAppState.pubChainVisibility = false;
    } else {
      OctopusAppElements.$pubChainContainer.removeClass('minimised');
      $('.fa.fa-chevron-down').removeClass('fa-chevron-down').addClass('fa-chevron-up');
      OctopusAppState.pubChainVisibility = true;
    }
  }

  function togglePubChainAutoshrink() {
    console.log('togglePubChainAutoshrink');
  }

  function togglePubChainMode() {
    console.log('togglePubChainMode');
  }

  const OctopusApp = {
    togglePubChainVisibility,
    togglePubChainAutoshrink,
    togglePubChainMode,
  };

  window.OctopusApp = OctopusApp;

  $(document).ready(() => {
    enableTooltips();
    toggleSearchScope(null, location.pathname);

    OctopusAppElements.$pubChainContainer = $('.pubChainContainer');
    OctopusAppElements.$pubChainControls = $('.pubChainControls');
  });
})();

// Search scope
function toggleSearchScope(event, url) {
  if (event) {
    event.preventDefault();
    url = $(event.currentTarget).attr('data-url');
  }

  const selection = $(`#searchFormTop a[data-url='${url}']`);

  if (!selection.length) {
    return;
  }

  $('#searchFormTop').attr('action', url);
  $('#searchFormTop .dropdown-selection').text(selection.text());
}

// Trigger form search action
function triggerSearch() {
  const searchInputValue = $('#searchTopFormTopInput').val();
  const valueWhiteSpaces = searchInputValue.replace(/\s/g, '').length;

  // check if input contains characters and the characters are other than ' ' (whitespace)
  if (searchInputValue && valueWhiteSpaces) {
    $('#searchFormTop').submit();
  }
}

// DOM HELPERS
function duplicatePrevNode(source) {
  const $source = $(source);
  const $clone = $source.prev().clone();
  const $input = $clone.find('input');

  if ($input && $input.val()) {
    $input.val('');
  }

  $clone.insertBefore($source);
  return false;
}

function removeInputEntry(source, inputSelector, parentSelector) {
  const $source = $(source);
  const $parent = $source.closest(parentSelector);
  const $input = $parent.find(inputSelector);

  if ($(parentSelector).length > 1) {         // Remove last entry if there are multiple ones
    $source.closest(parentSelector).remove();
  } else {                                    // Delete the contents
    $input.val('');
  }

  return false;
}