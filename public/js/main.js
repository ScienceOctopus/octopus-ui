function autofocusSearch() {
  $('input#mainSearchInput').focus();
}
function enableTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

$(document).ready(() => {
  // autofocusSearch();
  enableTooltips();
});
