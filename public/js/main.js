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
    initCollaboratorsSearch();

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

// Collaborators dynamic search - used in 2nd step of publishing
function initCollaboratorsSearch() {
  const $collaboratorsSelect = $("#publicationCollaborators");

  if (!$collaboratorsSelect.length) {
    return;
  }

  // User search
  const searchQuery = (query) => {
    const headers = { 'Content-Type': 'application/json' };
    return fetch(`/users/search?json=true&phrase=${query}`, { headers })
    .then(response => response.json())
  }

  // Start once bootstrap-select is loaded
  $collaboratorsSelect.on('loaded.bs.select', () => {
    const $searchBox = $collaboratorsSelect.parent().find('.bs-searchbox');
    const $searchInput = $searchBox.find('input');
    const $searchButton = $(`
      <div class="input-group-btn">
        <button type="button" class="btn btn-default">
          <i class="fa fa-search"></i>
        </button>
      </div>
    `);

    // Add the search button
    $searchBox.addClass('input-group');
    $searchBox.append($searchButton);

    // Start searching
    $searchButton.on('click', (e) => {
      e.stopPropagation();
      // Loading state - TRUE
      $searchInput.attr('disabled', true);
      $searchButton.find('i').attr('class', 'fa fa-refresh fa-spin');

      // Results to options
      const phase = $searchInput.val().trim();
      searchQuery(phase).then(response => {
        const options = response.results.reduce((acc, result) => {
          const { name } = result;
          const firstName = name['family-name'] ? name['family-name'].value : '';
          const lastName = name['given-names'] ? name['given-names'].value : '';
          return acc + `
            <option value="${name.path}" data-subtext="${name.path}">
              ${firstName} ${lastName}
            </option>\n`;
        }, '');

        // Update select-picker
        $collaboratorsSelect.html(options);
        $collaboratorsSelect.selectpicker('refresh');

        // Loading state - FALSE
        $searchInput.attr('disabled', false);
        $searchButton.find('i').attr('class', 'fa fa-search');
      });
    });

    // Submit on enter
    $searchInput.on('keydown', (e) => {
      if (e.which === 13) {
        $searchButton.click();
        return false;
      }
    });
  });
}
