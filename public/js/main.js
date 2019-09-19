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
      OctopusAppElements.$pubChainContainer.css({ height: 60 });
      $('.fa.fa-chevron-up').removeClass('fa-chevron-up').addClass('fa-chevron-down');
      OctopusAppState.pubChainVisibility = false;
    } else {
      OctopusAppElements.$pubChainContainer.css({ height: 'auto' });
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

    OctopusAppElements.$pubChainContainer = $('.pubChainContainer');
    OctopusAppElements.$pubChainControls = $('.pubChainControls');
  });
})();
