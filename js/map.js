function initialize() {
  $('.modal').on('show.bs.modal', function () {
    setTimeout(function () {
      var latlngAttr = $(this).attr('data-latlng');
      if (!latlngAttr) {
        return;
      }

      var latlng = latlngAttr.split(',').map(function (str) {
        return parseFloat(str);
      });

      var position = new google.maps.LatLng(latlng[0], latlng[1]);
      var mapOptions = {
        center: position,
        zoom: 18
      };

      var container = $(this).find('.map-canvas')[0];
      if (!container) {
        return;
      }

      var map = new google.maps.Map(container, mapOptions);
      new google.maps.Marker({
        position: position,
        map: map
      });
    }.bind(this), 1000);
  });
}

google.maps.event.addDomListener(window, 'load', initialize);