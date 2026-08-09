(function () {
  'use strict';

  var STORAGE_KEY = 'balcons-shop-cart';
  var configEl = document.getElementById('shop-config');
  if (!configEl) {
    return;
  }

  var config = JSON.parse(configEl.textContent);
  var cart = loadCart();

  var grid = document.getElementById('shop-grid');
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.shop-card-wrap')) : [];
  var resultCount = document.getElementById('shop-result-count');
  var emptyState = document.getElementById('shop-empty');
  var sortSelect = document.getElementById('shop-sort');
  var drawer = document.getElementById('shop-cart-drawer');
  var backdrop = document.getElementById('shop-cart-backdrop');
  var cartItemsEl = document.getElementById('shop-cart-items');
  var checkoutBtn = document.getElementById('shop-checkout-btn');
  var errorEl = document.getElementById('shop-cart-error');
  var shippingSelect = document.getElementById('shop-shipping-region');
  var selectedColors = {};

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCart();
  }

  function money(n) {
    return '€' + Number(n).toFixed(2);
  }

  function shippingAmount() {
    return shippingSelect && shippingSelect.value === 'international'
      ? config.shippingInternational
      : config.shippingSpain;
  }

  function cartSubtotal() {
    return cart.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function updateCartCount() {
    var count = cart.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    Array.prototype.forEach.call(document.querySelectorAll('.shop-cart-count'), function (el) {
      el.textContent = String(count);
      if (count > 0) {
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', 'hidden');
      }
    });
  }

  function openCart() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) {
      backdrop.hidden = false;
    }
    document.body.classList.add('shop-cart-open');
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) {
      backdrop.hidden = true;
    }
    document.body.classList.remove('shop-cart-open');
  }

  function renderCart() {
    updateCartCount();
    if (!cartItemsEl) return;

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="shop-cart-empty">Your cart is empty.</p>';
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      cartItemsEl.innerHTML = cart.map(function (item, index) {
        return (
          '<div class="shop-cart-line" data-index="' + index + '">' +
            '<img src="' + config.siteUrl + '/img/portfolio/' + item.image + '" alt="">' +
            '<div class="shop-cart-line-info">' +
              '<strong>' + escapeHtml(item.title) + '</strong>' +
              '<span>' + escapeHtml(item.size) + '</span>' +
              '<div class="shop-cart-qty">' +
                '<button type="button" data-action="dec" aria-label="Decrease quantity">−</button>' +
                '<span>' + item.quantity + '</span>' +
                '<button type="button" data-action="inc" aria-label="Increase quantity">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="shop-cart-line-side">' +
              '<strong>' + money(item.price * item.quantity) + '</strong>' +
              '<button type="button" data-action="remove" aria-label="Remove">Remove</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    var subtotal = cartSubtotal();
    var shipping = cart.length ? shippingAmount() : 0;
    var subtotalEl = document.getElementById('shop-cart-subtotal');
    var shippingEl = document.getElementById('shop-cart-shipping');
    var totalEl = document.getElementById('shop-cart-total');
    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (shippingEl) shippingEl.textContent = money(shipping);
    if (totalEl) totalEl.textContent = money(subtotal + shipping);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function addToCart(product) {
    var existing = cart.filter(function (item) {
      return item.id === product.id && item.size === product.size;
    })[0];
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        size: product.size,
        image: product.image,
        quantity: 1
      });
    }
    saveCart();
    openCart();
  }

  function applyFilters() {
    var districts = checkedValues('#shop-district-filters');
    var sizes = checkedValues('#shop-size-filters');
    var colorKeys = Object.keys(selectedColors).filter(function (key) {
      return selectedColors[key];
    });
    var visible = 0;

    cards.forEach(function (card) {
      var cardColors = (card.getAttribute('data-colors') || '').split(',').map(function (c) {
        return c.trim().toLowerCase();
      }).filter(Boolean);
      var district = card.getAttribute('data-district') || '';
      var size = card.getAttribute('data-size') || '';

      var colorOk = !colorKeys.length || colorKeys.some(function (c) {
        return cardColors.indexOf(c) !== -1;
      });
      var districtOk = !districts.length || districts.indexOf(district) !== -1;
      var sizeOk = !sizes.length || sizes.indexOf(size) !== -1;
      var show = colorOk && districtOk && sizeOk;
      card.hidden = !show;
      if (show) visible += 1;
    });

    sortCards();
    if (resultCount) resultCount.textContent = String(visible);
    if (emptyState) emptyState.hidden = visible > 0;
  }

  function checkedValues(selector) {
    var root = document.querySelector(selector);
    if (!root) return [];
    return Array.prototype.map.call(root.querySelectorAll('input:checked'), function (input) {
      return input.value;
    });
  }

  function sortCards() {
    if (!grid || !sortSelect) return;
    var mode = sortSelect.value;
    var sorted = cards.slice().sort(function (a, b) {
      var pa = Number(a.getAttribute('data-price'));
      var pb = Number(b.getAttribute('data-price'));
      var ta = (a.getAttribute('data-title') || '').toLowerCase();
      var tb = (b.getAttribute('data-title') || '').toLowerCase();
      var da = a.getAttribute('data-date') || '';
      var db = b.getAttribute('data-date') || '';
      if (mode === 'price-asc') return pa - pb;
      if (mode === 'price-desc') return pb - pa;
      if (mode === 'title') return ta < tb ? -1 : ta > tb ? 1 : 0;
      return db < da ? -1 : db > da ? 1 : 0;
    });
    sorted.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function showError(message) {
    if (!errorEl) return;
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function checkout() {
    showError('');
    if (!cart.length) return;

    if (!config.stripePublishableKey) {
      showError('Add your Stripe publishable key in _config.yml (shop.stripe_publishable_key).');
      return;
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting…';
    }

    fetch(config.checkoutApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(function (item) {
          return {
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            image: item.image
          };
        }),
        shippingRegion: shippingSelect ? shippingSelect.value : 'spain',
        successUrl: config.successUrl,
        cancelUrl: config.cancelUrl,
        currency: config.currency
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error(data.error || 'Checkout failed');
          }
          return data;
        });
      })
      .then(function (data) {
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (!window.Stripe) {
          throw new Error('Stripe.js failed to load');
        }
        var stripe = window.Stripe(config.stripePublishableKey);
        return stripe.redirectToCheckout({ sessionId: data.id }).then(function (result) {
          if (result.error) {
            throw new Error(result.error.message);
          }
        });
      })
      .catch(function (err) {
        showError(err.message || 'Checkout failed');
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = 'Checkout with Stripe';
        }
      });
  }

  /* Gallery */
  var galleryModal = document.getElementById('shop-gallery-modal');
  var galleryImage = document.getElementById('shop-gallery-image');
  var galleryTitle = document.getElementById('shop-gallery-title');
  var galleryCounter = document.getElementById('shop-gallery-counter');
  var galleryImages = [];
  var galleryIndex = 0;

  function openGallery(title, images) {
    galleryImages = images.filter(Boolean);
    galleryIndex = 0;
    if (!galleryImages.length || !galleryModal) return;
    if (galleryTitle) galleryTitle.textContent = title;
    renderGalleryFrame();
    galleryModal.hidden = false;
  }

  function closeGallery() {
    if (galleryModal) galleryModal.hidden = true;
  }

  function renderGalleryFrame() {
    if (!galleryImage) return;
    galleryImage.src = config.siteUrl + '/img/portfolio/' + galleryImages[galleryIndex];
    galleryImage.alt = galleryTitle ? galleryTitle.textContent : '';
    if (galleryCounter) {
      galleryCounter.textContent = (galleryIndex + 1) + ' / ' + galleryImages.length;
    }
  }

  /* Events */
  document.addEventListener('click', function (event) {
    var addBtn = event.target.closest('.shop-add-to-cart');
    if (addBtn) {
      addToCart({
        id: addBtn.getAttribute('data-id'),
        title: addBtn.getAttribute('data-title'),
        price: addBtn.getAttribute('data-price'),
        size: addBtn.getAttribute('data-size'),
        image: addBtn.getAttribute('data-image')
      });
      return;
    }

    if (event.target.closest('.shop-cart-toggle')) {
      event.preventDefault();
      openCart();
      return;
    }

    if (event.target.closest('#shop-cart-close') || event.target === backdrop) {
      closeCart();
      return;
    }

    var lineBtn = event.target.closest('[data-action]');
    if (lineBtn && lineBtn.closest('.shop-cart-line')) {
      var line = lineBtn.closest('.shop-cart-line');
      var index = Number(line.getAttribute('data-index'));
      var action = lineBtn.getAttribute('data-action');
      if (action === 'inc') cart[index].quantity += 1;
      if (action === 'dec') cart[index].quantity = Math.max(1, cart[index].quantity - 1);
      if (action === 'remove') cart.splice(index, 1);
      saveCart();
      return;
    }

    var swatch = event.target.closest('.shop-color-swatch');
    if (swatch) {
      var color = swatch.getAttribute('data-color');
      selectedColors[color] = !selectedColors[color];
      swatch.classList.toggle('is-active', !!selectedColors[color]);
      return;
    }

    if (event.target.closest('#shop-apply-filters')) {
      applyFilters();
      return;
    }

    if (event.target.closest('#shop-clear-filters')) {
      selectedColors = {};
      Array.prototype.forEach.call(document.querySelectorAll('.shop-color-swatch'), function (el) {
        el.classList.remove('is-active');
      });
      Array.prototype.forEach.call(document.querySelectorAll('#shop-filters input[type="checkbox"]'), function (el) {
        el.checked = false;
      });
      applyFilters();
      return;
    }

    var media = event.target.closest('.shop-open-gallery');
    if (media) {
      var card = media.closest('.shop-card-wrap');
      openGallery(
        card.getAttribute('data-title'),
        (card.getAttribute('data-images') || '').split(',')
      );
      return;
    }

    if (event.target.closest('#shop-gallery-close') || event.target === galleryModal) {
      closeGallery();
      return;
    }

    if (event.target.closest('#shop-gallery-prev')) {
      galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
      renderGalleryFrame();
      return;
    }

    if (event.target.closest('#shop-gallery-next')) {
      galleryIndex = (galleryIndex + 1) % galleryImages.length;
      renderGalleryFrame();
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortCards();
    });
  }

  if (shippingSelect) {
    shippingSelect.addEventListener('change', renderCart);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }

  /* Polyfill-ish closest for older browsers already using jQuery elsewhere */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (sel) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches(sel)) return el;
        el = el.parentElement;
      }
      return null;
    };
  }

  renderCart();
  applyFilters();
})();
