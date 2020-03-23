(() => {
  const OctopusAppState = {
    pubChainVisibility: true
  };
  const OctopusAppElements = {};
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

  function drawHorizontalLinks() {
    // Constants
    const ITEMS_SPACING = 10;       // Space between publication items
    const OFFSET_TOP = 46;          // Space taken by the column header (title)
    const ACTIVE_CLASS = "active";  // State classes - current publication (active)
    const HIGH_CLASS = "highlight"; // State classes - linked publication (highlighted)
    const LINK_ATTR = "linked";     // PubItem attribute - linked publications ids

    const { $pubChainContainer, $pubChainColumns } = OctopusAppElements;

    // Nothing to do if we don't have the chain element
    if (!$pubChainContainer.length) return;

    // Setup
    const currentPublicationId = $pubChainContainer.data("publication");
    const activePublicationItem = $pubChainColumns.find(`.pubItem#${currentPublicationId}`);

    // Dimensions
    const pubItemHeight = $pubChainColumns.find(".pubItem").first().outerHeight();

    // Update the svg viewbox based on the dimensions of the svg
    $pubChainContainer.find("svg").each((i, svg) => {
      svg.setAttribute("viewBox", `0, 0, ${$(svg).width()}, ${$(svg).height()}`);
    });

    // Mark the current publication item as active
    activePublicationItem.addClass(ACTIVE_CLASS);
    markBackwards(activePublicationItem); // Highlight items going backwards | < ACTIVE
    markForwards(activePublicationItem);  // Highlight items going forwards  | ACTIVE >


    // Setup & Draw
    $pubChainColumns.each(updateSvg);
    // Re-draw the Y on scroll
    $pubChainColumns.find(".publicationsList").scroll((e) => {
      const currentPublicationsList = $(e.target);
      const nextSvgElement = currentPublicationsList.parent().next();
      const prevSvgElement = currentPublicationsList.parent().prev();

      // Handle Y1 in the next SVG
      nextSvgElement.find("path").each((_i, pathSvgElement) => {
        const $pathSvgElement = $(pathSvgElement);
        let coords = $pathSvgElement.attr("d").split(" ");

        let y1 = coords[2];
        if ($pathSvgElement.data("y1")) {
          y1 = $pathSvgElement.data("y1");
        }

        // Update the Y values
        let newY = +y1 - currentPublicationsList.scrollTop();
        coords[2] = newY;
        coords[5] = newY;

        $pathSvgElement.data("y1", y1);
        $pathSvgElement.attr("d", coords.join(" "));
      });

      // Handle Y2 in the previous SVG
      prevSvgElement.find("path").each((_i, pathSvgElement) => {
        const $pathSvgElement = $(pathSvgElement);
        let coords = $pathSvgElement.attr("d").split(" ");

        let y2 = coords[7].replace(",", "");
        if ($pathSvgElement.data("y2")) {
          y2 = $pathSvgElement.data("y2");
        }

        // Update the Y values
        let newY = +y2 - currentColumnElement.scrollTop();
        coords[7] = newY + ",";
        coords[9] = newY;

        $pathSvgElement.data("y2", y2);
        $pathSvgElement.attr("d", coords.join(" "));
      });
    });


    function updateSvg(_colIndex, columnElement) {
      // Setup
      const currentColumnElement = $(columnElement);
      const nextSvgElement = currentColumnElement.next();
      const nextColumnElement = nextSvgElement.next();

      // Nothing to do, exit
      if (!nextColumnElement.length) return;

      // Grab the current marked elements - can be active or highlighted
      const currentMarkedItems = currentColumnElement.find(`
        .pubItem.${ACTIVE_CLASS},
        .pubItem.${HIGH_CLASS}`
      );

      // Start creating the paths
      let html = "";
      currentMarkedItems.each((markedItemIndex, currentMarkedElem) => {
        const currentMarkedItem = $(currentMarkedElem);
        // Grab the linked elements from the next column - can be active or highlighted
        const nextMarkedItems = nextColumnElement.find(`
          .pubItem.${ACTIVE_CLASS}[linked*='${currentMarkedItem.attr("id")}'],
          .pubItem.${HIGH_CLASS}[linked*='${currentMarkedItem.attr("id")}']`
        );

        // Compute the line coordinates
        const x1 = 0;                                 // x1 is always 0
        const x2 = nextSvgElement.width();            // x2 is always the width of the svg
        const y1 = getYCoordinate(currentMarkedItem); // y1 is the line start, y2 is computed below

        nextMarkedItems.each((nextMarkedItemIndex, linkedElement) => {
          const y2 = getYCoordinate($(linkedElement)) // y2 coordinate - line end
          html += `<path d="M ${x1} ${y1} C ${x2/2} ${y1}, ${x2/2} ${y2}, ${x2} ${y2}" vector-effect="non-scaling-stroke"></path>`
        });
      })

      // Update the SVG
      nextSvgElement.html(html);
    }


    function getYCoordinate(currentMarkedItem) {
      if (!currentMarkedItem.length) return OFFSET_TOP + pubItemHeight / 2;
      const currentMarkedElementPos = currentMarkedItem.index();
      const currentMarkedElementSpacing = OFFSET_TOP + ITEMS_SPACING * currentMarkedElementPos;
      return currentMarkedElementSpacing + (pubItemHeight * currentMarkedElementPos) + pubItemHeight / 2;

    };

    function markBackwards(currentMarkedItem) {
      if (!currentMarkedItem.attr(LINK_ATTR)) return;
      const prevColumn = currentMarkedItem.closest(".typeColumn").prev().prev();
      const prevMarkedItemsIds = currentMarkedItem.attr(LINK_ATTR).split(",");
      const prevMarkedItemsSelectors = prevMarkedItemsIds.map(s => `.pubItem#${s}`);
      const prevFoundItems = prevColumn.find(prevMarkedItemsSelectors.join(","));
      prevFoundItems.each((i, item) => {
        $(item).addClass(HIGH_CLASS);
        markBackwards($(item));
      });
    }

    function markForwards(currentMarkedItem) {
      const nextColumn = currentMarkedItem.closest(".typeColumn").next().next();
      const nextFoundItems = nextColumn.find(`.pubItem[linked*='${currentMarkedItem.attr("id")}']`);
      nextFoundItems.each((i, item) => {
        $(item).addClass(HIGH_CLASS);
        markForwards($(item));
      });
    }
  }

  const OctopusApp = {
    togglePubChainVisibility,
    togglePubChainAutoshrink,
    togglePubChainMode,
  };
  window.OctopusApp = OctopusApp;
  $(document).ready(() => {
    OctopusAppElements.$pubChainContainer = $('.pubChainContainer');
    OctopusAppElements.$pubChainControls = $('.pubChainControls');
    OctopusAppElements.$pubChainColumns = $('.typeColumn');

    enableTooltips();
    enablePopovers();
    toggleSearchScope(null, location.pathname);
    drawHorizontalLinks();
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
