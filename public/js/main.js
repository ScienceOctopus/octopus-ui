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
    url = $(event.currentTarget).attr("data-url");
  }

  const selection = $(`#searchFormTop a[data-url="${url}"]`);

  if (!selection.length) {
    return;
  }

  $('#searchFormTop').attr('action', url);
  $('#searchFormTop .dropdown-selection').text(selection.text());
}
