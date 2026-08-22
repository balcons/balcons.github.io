(function () {
  var DATA_EL = document.getElementById("balconies-map-data");
  var MAP_EL = document.getElementById("balconies-map");
  if (!DATA_EL || !MAP_EL) {
    return;
  }

  var BARCELONA_CENTER = { lat: 41.3874, lng: 2.1686 };
  var WORLD_CENTER = { lat: 46.2, lng: 6.1 };
  var IMAGE_BASE = "/img/portfolio/";
  var PIN_URL = "/img/map-pin.svg";
  var PIN_ACTIVE_URL = "/img/map-pin-active.svg";

  var DISTRICT_ORDER = [
    "Eixample",
    "Gràcia",
    "El Born",
    "Barceloneta",
    "Gòtic",
    "Raval",
    "Sants",
    "Sant Martí",
    "Sarrià - Sant Gervasi",
    "Horta-Guinardó",
    "Others"
  ];

  var DISTRICT_BOXES = [
    { name: "Barceloneta", south: 41.372, north: 41.3825, west: 2.183, east: 2.198 },
    { name: "El Born", south: 41.382, north: 41.3905, west: 2.177, east: 2.188 },
    { name: "Gòtic", south: 41.378, north: 41.3875, west: 2.173, east: 2.181 },
    { name: "Raval", south: 41.375, north: 41.3855, west: 2.163, east: 2.174 },
    { name: "Sants", south: 41.365, north: 41.3805, west: 2.125, east: 2.150 },
    { name: "Gràcia", south: 41.400, north: 41.420, west: 2.145, east: 2.168 },
    { name: "Horta-Guinardó", south: 41.408, north: 41.430, west: 2.155, east: 2.185 },
    { name: "Sant Martí", south: 41.388, north: 41.430, west: 2.185, east: 2.230 },
    { name: "Sarrià - Sant Gervasi", south: 41.393, north: 41.420, west: 2.118, east: 2.155 },
    { name: "Eixample", south: 41.383, north: 41.401, west: 2.145, east: 2.182 }
  ];

  var DISTRICT_KEYWORDS = [
    { name: "Eixample", keys: ["eixample", "granados", "aribau", "consell de cent", "rambla de catalunya", "passeig de gràcia", "passeig de gracia", "valència", "valencia", "bruc", "diagonal"] },
    { name: "Gràcia", keys: ["gràcia", "gracia", "gran de gràcia", "badia", "riera de cassoles"] },
    { name: "El Born", keys: ["born", "argenteria", "santa maria", "santa caterina", "ribera", "placeta", "marcus", "marcús"] },
    { name: "Barceloneta", keys: ["barceloneta", "baluard", "pla de palau"] },
    { name: "Gòtic", keys: ["gòtic", "gothic", "bisbe", "catedral", "ciutat vella", "arcs"] },
    { name: "Raval", keys: ["raval", "carme", "sant agustí", "rambla"] },
    { name: "Sants", keys: ["sants", "olzinelles"] },
    { name: "Sant Martí", keys: ["sant martí", "sant marti", "poblenou", "marina"] },
    { name: "Sarrià - Sant Gervasi", keys: ["sarrià", "sarria", "gervasi", "santaló", "santalo", "mitre"] },
    { name: "Horta-Guinardó", keys: ["sant pau", "claret", "guinardó", "guinardo", "horta"] }
  ];

  var CITY_KEYWORDS = [
    { name: "Amsterdam", keys: ["amsterdam", "netherlands", "holland", "leidsegracht", "ringdijk", "linnaeusstraat", "mauritskade", "ruyschstraat", "rozengracht"] },
    { name: "Lisbon", keys: ["lisbon", "lisboa", "portugal", "herculano"] },
    { name: "Geneva", keys: ["geneva", "genève", "genive", "switzerland", "suisse"] },
    { name: "Naples", keys: ["napoli", "naples", "italy", "italia"] },
    { name: "Figueres", keys: ["figueres", "figueras", "dalí", "dali"] }
  ];

  var COUNTRY_BY_CITY = {
    Amsterdam: "Netherlands",
    Lisbon: "Portugal",
    Geneva: "Switzerland",
    Naples: "Italy"
  };

  var COUNTRY_ORDER = ["Italy", "Netherlands", "Portugal", "Switzerland"];

  var STYLE_KEYWORDS = [
    { name: "Plants", keys: ["cactus", "flor", "florist", "rose", "rosas", "plant", "green", "luna"] },
    { name: "People", keys: ["man", "hands", "yoga", "people", "cara", "astronaut", "monkey"] },
    { name: "Architecture", keys: ["casa", "pont", "catedral", "hotel", "building", "portal"] }
  ];

  function parseData() {
    try {
      return JSON.parse(DATA_EL.textContent);
    } catch (err) {
      return [];
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function inBox(item, box) {
    return item.lat >= box.south && item.lat <= box.north && item.lng >= box.west && item.lng <= box.east;
  }

  function matchKeywords(text, groups) {
    for (var i = 0; i < groups.length; i++) {
      for (var k = 0; k < groups[i].keys.length; k++) {
        if (text.indexOf(normalizeText(groups[i].keys[k])) !== -1) {
          return groups[i].name;
        }
      }
    }
    return "";
  }

  function inferDistrict(item) {
    var text = normalizeText(item.description);
    var named = matchKeywords(text, DISTRICT_KEYWORDS);
    if (named) {
      return named;
    }
    for (var i = 0; i < DISTRICT_BOXES.length; i++) {
      if (inBox(item, DISTRICT_BOXES[i])) {
        return DISTRICT_BOXES[i].name;
      }
    }
    return "Others";
  }

  function inferCity(item) {
    var text = normalizeText(item.description);
    var named = matchKeywords(text, CITY_KEYWORDS);
    if (named) {
      return named;
    }
    if (item.lat > 52 && item.lat < 52.5 && item.lng > 4.7 && item.lng < 5.1) {
      return "Amsterdam";
    }
    if (item.lat > 38.6 && item.lat < 38.9 && item.lng > -9.3 && item.lng < -9.0) {
      return "Lisbon";
    }
    if (item.lat > 46.1 && item.lat < 46.3 && item.lng > 6.0 && item.lng < 6.3) {
      return "Geneva";
    }
    if (item.lat > 40.7 && item.lat < 41.0 && item.lng > 14.1 && item.lng < 14.4) {
      return "Naples";
    }
    if (item.lat > 42.2 && item.lat < 42.4 && item.lng > 2.8 && item.lng < 3.1) {
      return "Figueres";
    }
    return "World";
  }

  function inferCountry(item) {
    return COUNTRY_BY_CITY[item.city] || item.city || "World";
  }

  function inferStyle(item) {
    var text = normalizeText(item.description + " " + item.img);
    return matchKeywords(text, STYLE_KEYWORDS) || "Other";
  }

  function inferStreet(description) {
    var text = String(description || "").replace(/\s+/g, " ").trim();
    var match = text.match(
      /(\d+\s+)?((Carrer|Calle|Plaça|Plaza|Passeig|Paseo|Avinguda|Avenida|Rambla|Ronda|Passatge|Placeta|Rua|R\.|Via|Piazza|Corso|Viale|Rue|Quai|Ringdijk|Leidsegracht|Linnaeusstraat|Mauritskade|Ruyschstraat|Rozengracht)[^,.]*)/i
    );
    if (match) {
      return match[0].replace(/^[\s,.-]+|[\s,.-]+$/g, "");
    }
    return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim().slice(0, 48);
  }

  function uniqueSorted(values, preferredOrder) {
    var seen = {};
    var list = [];
    values.forEach(function (value) {
      if (value && !seen[value]) {
        seen[value] = true;
        list.push(value);
      }
    });
    if (!preferredOrder) {
      return list.sort();
    }
    list.sort(function (a, b) {
      var ia = preferredOrder.indexOf(a);
      var ib = preferredOrder.indexOf(b);
      if (ia === -1) ia = preferredOrder.length;
      if (ib === -1) ib = preferredOrder.length;
      if (ia === ib) {
        return a.localeCompare(b);
      }
      return ia - ib;
    });
    return list;
  }

  function fillSelect(select, values, allLabel) {
    var current = select.value;
    select.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (values.indexOf(current) !== -1) {
      select.value = current;
    }
  }

  function imageUrl(item) {
    return IMAGE_BASE + item.img;
  }

  function createGoogleEngine(map) {
    var googlePin = {
      url: PIN_URL,
      scaledSize: new google.maps.Size(28, 38),
      anchor: new google.maps.Point(14, 38)
    };
    var googleActive = {
      url: PIN_ACTIVE_URL,
      scaledSize: new google.maps.Size(34, 46),
      anchor: new google.maps.Point(17, 46)
    };
    var markers = [];
    return {
      addMarker: function (item, onClick) {
        var marker = new google.maps.Marker({
          position: { lat: item.lat, lng: item.lng },
          map: map,
          icon: googlePin,
          title: item.street || item.district,
          optimized: false
        });
        marker.addListener("click", function () {
          onClick(item, marker);
        });
        markers.push(marker);
        return marker;
      },
      clearMarkers: function () {
        markers.forEach(function (marker) {
          marker.setMap(null);
        });
        markers = [];
      },
      fit: function (list, collection) {
        if (!list.length) {
          map.setCenter(collection === "world" ? WORLD_CENTER : BARCELONA_CENTER);
          map.setZoom(collection === "world" ? 4 : 13);
          return;
        }
        if (list.length === 1) {
          map.setCenter({ lat: list[0].lat, lng: list[0].lng });
          map.setZoom(16);
          return;
        }
        var bounds = new google.maps.LatLngBounds();
        list.forEach(function (item) {
          bounds.extend({ lat: item.lat, lng: item.lng });
        });
        map.fitBounds(bounds, 64);
      },
      panTo: function (lat, lng) {
        map.panTo({ lat: lat, lng: lng });
      },
      focus: function (lat, lng, zoom) {
        map.panTo({ lat: lat, lng: lng });
        map.setZoom(zoom || 18);
      },
      setActive: function (marker, active) {
        marker.setIcon(active ? googleActive : googlePin);
        marker.setZIndex(active ? 1000 : 1);
      },
      zoomBy: function (delta) {
        map.setZoom(map.getZoom() + delta);
      },
      zoomTo: function (level) {
        map.setZoom(level);
      },
      onBackgroundClick: function (handler) {
        map.addListener("click", handler);
      },
      resize: function () {
        google.maps.event.trigger(map, "resize");
      }
    };
  }

  function startGoogleMap(center, zoom) {
    return new Promise(function (resolve, reject) {
      if (!(window.google && google.maps && google.maps.Map)) {
        reject(new Error("Google Maps failed to load"));
        return;
      }
      var settled = false;
      function finish(err, map) {
        if (settled) {
          return;
        }
        settled = true;
        if (err) {
          reject(err);
        } else {
          resolve(map);
        }
      }
      window.gm_authFailure = function () {
        finish(new Error("Google Maps API key is not allowed for this address"));
      };
      var map;
      try {
        map = new google.maps.Map(MAP_EL, {
          center: center,
          zoom: zoom,
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          mapTypeControl: false,
          zoomControl: false,
          fullscreenControl: false,
          streetViewControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          }
        });
        var streetView = map.getStreetView();
        streetView.addListener("visible_changed", function () {
          var controls = document.querySelector(".map-controls");
          if (controls) {
            controls.hidden = streetView.getVisible();
          }
        });
      } catch (err) {
        finish(err);
        return;
      }
      google.maps.event.addListenerOnce(map, "idle", function () {
        finish(null, map);
      });
      setTimeout(function () {
        if (MAP_EL.querySelector(".gm-style")) {
          finish(null, map);
        } else {
          finish(new Error("Google Maps did not render"));
        }
      }, 4000);
    });
  }

  function boot() {
    var items = parseData()
      .filter(function (item) {
        return isFinite(item.lat) && isFinite(item.lng);
      })
      .map(function (item) {
        item.district = inferDistrict(item);
        item.city = inferCity(item);
        item.country = inferCountry(item);
        item.style = inferStyle(item);
        item.street = inferStreet(item.description);
        return item;
      });

    var params = new URLSearchParams(window.location.search);
    var state = {
      collection: params.get("collection") === "world" ? "world" : "barcelona",
      district: params.get("district") || "",
      style: params.get("style") || "",
      activeId: params.get("id") || ""
    };

    var districtSelect = document.getElementById("map-district-filter");
    var styleSelect = document.getElementById("map-style-filter");
    var countEl = document.getElementById("map-count");
    var preview = document.getElementById("map-preview");
    var previewImg = document.getElementById("map-preview-img");
    var previewDistrict = document.getElementById("map-preview-district");
    var previewStreet = document.getElementById("map-preview-street");
    var previewOpen = document.getElementById("map-preview-open");
    var previewClose = document.getElementById("map-preview-close");
    var lightbox = document.getElementById("map-lightbox");
    var lightboxImg = document.getElementById("map-lightbox-img");
    var lightboxCaption = document.getElementById("map-lightbox-caption");
    var lightboxClose = document.getElementById("map-lightbox-close");
    var pills = document.querySelectorAll(".map-pill");

    var center = state.collection === "world" ? WORLD_CENTER : BARCELONA_CENTER;
    var zoom = state.collection === "world" ? 4 : 13;
    var googleReady = window.google && google.maps && google.maps.importLibrary
      ? Promise.all([
          google.maps.importLibrary("maps"),
          google.maps.importLibrary("marker"),
          google.maps.importLibrary("streetView")
        ]).catch(function () {})
      : Promise.resolve();

    googleReady.then(function () {
      return startGoogleMap(center, zoom);
    }).then(function (googleMap) {
      var engine = createGoogleEngine(googleMap);

      var activeMarker = null;
      var selectedItem = null;

      function visibleItems() {
        return items.filter(function (item) {
          if (item.collection !== state.collection) {
            return false;
          }
          if (state.district) {
            var place = state.collection === "world" ? item.country : item.district;
            if (place !== state.district) {
              return false;
            }
          }
          if (state.style && item.style !== state.style) {
            return false;
          }
          return true;
        });
      }

      function refreshFilters() {
        var collectionItems = items.filter(function (item) {
          return item.collection === state.collection;
        });
        var places = collectionItems.map(function (item) {
          return state.collection === "world" ? item.country : item.district;
        });
        var styles = collectionItems.map(function (item) {
          return item.style;
        });
        fillSelect(
          districtSelect,
          uniqueSorted(places, state.collection === "world" ? COUNTRY_ORDER : DISTRICT_ORDER),
          state.collection === "world" ? "All countries" : "All districts"
        );
        districtSelect.setAttribute("aria-label", state.collection === "world" ? "All countries" : "All districts");
        fillSelect(styleSelect, uniqueSorted(styles, ["Plants", "People", "Architecture", "Other"]), "All styles");
        if (state.district) {
          districtSelect.value = state.district;
        }
        if (state.style) {
          styleSelect.value = state.style;
        }
      }

      function hidePreview() {
        preview.hidden = true;
        selectedItem = null;
        if (activeMarker) {
          engine.setActive(activeMarker, false);
          activeMarker = null;
        }
      }

      function showPreview(item, marker) {
        selectedItem = item;
        if (activeMarker && activeMarker !== marker) {
          engine.setActive(activeMarker, false);
        }
        activeMarker = marker;
        engine.setActive(marker, true);
        previewImg.src = imageUrl(item);
        previewImg.alt = item.description || "Balcony illustration";
        previewDistrict.textContent = state.collection === "world"
          ? (item.city && item.country && item.city !== item.country ? item.city + ", " + item.country : (item.country || item.city))
          : item.district;
        previewStreet.textContent = item.street || item.description;
        previewOpen.href = item.url || "#";
        preview.hidden = false;
        engine.focus(item.lat, item.lng, 18);
      }

      function openLightbox(item) {
        lightboxImg.src = imageUrl(item);
        lightboxImg.alt = item.description || "Balcony illustration";
        lightboxCaption.textContent = item.description || "";
        lightbox.hidden = false;
        document.body.classList.add("map-lightbox-open");
      }

      function closeLightbox() {
        lightbox.hidden = true;
        document.body.classList.remove("map-lightbox-open");
      }

      function render() {
        var list = visibleItems();
        countEl.textContent = list.length + (list.length === 1 ? " balcony" : " balconies");
        engine.clearMarkers();
        hidePreview();
        list.forEach(function (item) {
          var marker = engine.addMarker(item, showPreview);
          item._marker = marker;
        });
        engine.fit(list, state.collection);
        setTimeout(function () {
          engine.resize();
          engine.fit(list, state.collection);
        }, 200);
        if (state.activeId) {
          var match = list.filter(function (item) {
            return String(item.id) === String(state.activeId);
          })[0];
          if (match && match._marker) {
            showPreview(match, match._marker);
          }
          state.activeId = "";
        }
      }

      pills.forEach(function (pill) {
        pill.addEventListener("click", function () {
          state.collection = pill.getAttribute("data-collection");
          state.district = "";
          pills.forEach(function (btn) {
            var active = btn === pill;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", active ? "true" : "false");
          });
          refreshFilters();
          render();
        });
      });

      districtSelect.addEventListener("change", function () {
        state.district = districtSelect.value;
        render();
      });
      styleSelect.addEventListener("change", function () {
        state.style = styleSelect.value;
        render();
      });
      previewClose.addEventListener("click", hidePreview);
      lightboxClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });
      engine.onBackgroundClick(hidePreview);
      document.getElementById("map-zoom-in").addEventListener("click", function () {
        engine.zoomBy(1);
      });
      document.getElementById("map-zoom-out").addEventListener("click", function () {
        engine.zoomBy(-1);
      });
      document.getElementById("map-locate").addEventListener("click", function () {
        if (!navigator.geolocation) {
          return;
        }
        navigator.geolocation.getCurrentPosition(function (position) {
          engine.panTo(position.coords.latitude, position.coords.longitude);
          engine.zoomTo(15);
        });
      });

      pills.forEach(function (pill) {
        var active = pill.getAttribute("data-collection") === state.collection;
        pill.classList.toggle("is-active", active);
        pill.setAttribute("aria-pressed", active ? "true" : "false");
      });

      refreshFilters();
      render();
      setTimeout(function () {
        engine.resize();
        engine.fit(visibleItems(), state.collection);
      }, 250);
    }).catch(function () {
      MAP_EL.innerHTML = "<p class=\"map-unavailable\">Google Maps could not load here. Add <code>http://127.0.0.1:4000/*</code> and <code>http://localhost:4000/*</code> to the API key website restrictions, then refresh. On the live site it uses Google Maps automatically.</p>";
    });
  }

  boot();
})();
