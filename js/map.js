function initializeLeaflet() {
  $('.modal').on('shown.bs.modal', function () {
    var $modal = $(this);
    var latlngAttr = $modal.attr('data-latlng');
    if (!latlngAttr) {
      return;
    }

    var latlng = latlngAttr.split(',').map(function (str) {
      return parseFloat(str);
    });

    var container = $modal.find('.map-canvas')[0];
    if (!container) {
      return;
    }

    // If a map was already initialized in this element, reset it
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    var map = L.map(container).setView(latlng, 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker(latlng).addTo(map);

    // Ensure proper sizing after modal animation
    setTimeout(function () {
      map.invalidateSize();
    }, 200);
  });
}

$(window).on('load', initializeLeaflet);