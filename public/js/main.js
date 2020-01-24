(() => {
  const OctopusAppState = {
    pubChainVisibility: true
  };
  const OctopusAppElements = {};
  let lastClickedId;
  // function autofocusSearch() {
  //   $('input#mainSearchInput').focus();
  // }
  function enableTooltips() {
    $('[data-toggle="tooltip"]').tooltip();
  }
  function enablePopovers() {
    $('[data-toggle="popover"]').popover();
  }
  function togglePubChainVisibility() {
    console.log('togglePubChainVisibility');
    if (OctopusAppState.pubChainVisibility) {
      OctopusAppElements.$pubChainContainer.addClass('minimised');
      $('.fa.fa-chevron-up')
        .removeClass('fa-chevron-up')
        .addClass('fa-chevron-down');
      OctopusAppState.pubChainVisibility = false;
    } else {
      OctopusAppElements.$pubChainContainer.removeClass('minimised');
      $('.fa.fa-chevron-down')
        .removeClass('fa-chevron-down')
        .addClass('fa-chevron-up');
      OctopusAppState.pubChainVisibility = true;
    }
  }
  function togglePubChainAutoshrink() {
    console.log('togglePubChainAutoshrink');
  }
  function togglePubChainMode() {
    console.log('togglePubChainMode');
  }
  function toggleHorizontalLinks(_id) {
    if (lastClickedId !== _id) {
      // remove active class from previous clicked item
      OctopusAppElements.$pubItem = $(`.pubItem`);
      OctopusAppElements.$pubItem.removeClass('active');
      // add active class to newly clicked item
      OctopusAppElements.$pubItem = $(`#${_id}`);
      OctopusAppElements.$pubItem.addClass('active');
      lastClickedId = _id;
    } else {
      // clicked on the same one, remove active class
      OctopusAppElements.$pubItem = $(`.pubItem`);
      OctopusAppElements.$pubItem.removeClass('active');
      lastClickedId = null;
    }
  }
  const OctopusApp = {
    togglePubChainVisibility,
    togglePubChainAutoshrink,
    togglePubChainMode,
    toggleHorizontalLinks
  };
  window.OctopusApp = OctopusApp;
  $(document).ready(() => {
    enableTooltips();
    enablePopovers();
    toggleSearchScope(null, location.pathname);
    OctopusAppElements.$pubChainContainer = $('.pubChainContainer');
    OctopusAppElements.$pubChainControls = $('.pubChainControls');
    OctopusAppElements.$pubColumns = $('.typeColumn');
    let positions = [];
    Array.from(OctopusAppElements.$pubColumns).forEach((el, idx) => {
      positions.push({
        x:
          el.offsetWidth -
          (el.offsetWidth - $(el).width()) / 2 +
          idx * el.offsetWidth,
        y: 0
      });
      // console.log(element)
      console.log(
        idx,
        el.offsetWidth,
        el.clientWidth,
        el.paddingLeft,
        $(el).width()
      );
    });
    // console.log('postions', positions)
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
