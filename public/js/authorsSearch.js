(() => {
  $(document).ready(() => {
    initCollaboratorsSearch();
  });
})();

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
          const { name, organization } = result;
          const organizationName = organization ? organization.name : '';
          const firstName = name['family-name'] ? name['family-name'].value : '';
          const lastName = name['given-names'] ? name['given-names'].value : '';
          return acc + `
            <option value="${name.path}" data-subtext="${organizationName}">
              ${firstName} ${lastName}
            </option>\n`;
        }, '');

        // Remove all options, keeping the default one selected
        $collaboratorsSelect.find('option:not([default])').remove();
        // Append the search result
        $collaboratorsSelect.append(options);

        // Update select-picker
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