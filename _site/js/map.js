function initialize() {
    $('.modal').on('show.bs.modal', function (event) {
      setTimeout(function() {
        var latlng = $(this).attr('data-latlng').split(',').map(function(str) {
          return parseFloat(str);
        });
        var position = new google.maps.LatLng(latlng[0], latlng[1]);
        var mapOptions = {
          center: position,
          zoom: 18
        };
        var map = new google.maps.Map(
            $(this).find('.map-canvas')[0], mapOptions);
        var panoramaOptions = {
          position: position,
          pov: {
            heading: 270,
            pitch: 95
          },
        };
        var marker = new google.maps.Marker({
              position: position,
              map: map
        });

        // Works only on first modal. The others are displaying only google map but not streetview.
        // var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
        // panorama.setVisible(true);
        // map.setStreetView(panorama);
        var myPano = new google.maps.StreetViewPanorama(
              document.getElementById('pano'),
              panoramaOptions);
        myPano.setVisible(true);



      }.bind(this), 1000);
    });
  }

google.maps.event.addDomListener(window, 'load', initialize);