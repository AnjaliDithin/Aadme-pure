/**
 * SUGAR Cosmetics Interactive Features for Aadame Pure
 * - Tap-to-copy promo codes with visual confirmation
 * - Interactive pincode delivery date estimator with local storage
 * - Floating Wishlist Heart toggle with persistence
 * - Sticky Bottom "Add to Bag" bar with smooth scroll detection
 * - Dynamic Free Shipping Progress Bar in cart drawer
 */
(function () {
  class SugarCosmeticsFeatures {
    constructor() {
      this.init();
      document.addEventListener('shopify:section:load', () => this.init());
      document.addEventListener('quick-add:loaded', () => this.init());

      // Listen for cart updates to refresh shipping progress bar
      if (window.subscribe && window.PUB_SUB_EVENTS) {
        subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
          this.updateCartShippingBar(event.cart);
        });
      }
    }

    init() {
      this.initPromoCopy();
      this.initPincodeChecker();
      this.initWishlist();
      this.initStickyBuyBar();
      this.initVerticalThumbnailsHover();
    }

    /* 1. Tap-to-Copy Promo Codes */
    initPromoCopy() {
      document.querySelectorAll('.sugar-copy-btn:not([data-copy-bound])').forEach((btn) => {
        btn.setAttribute('data-copy-bound', 'true');
        btn.addEventListener('click', async () => {
          const code = btn.getAttribute('data-code') || 'PURE15';
          try {
            await navigator.clipboard.writeText(code);
            const originalText = btn.textContent;
            btn.textContent = 'COPIED! ✓';
            btn.classList.add('is-copied');

            setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.remove('is-copied');
            }, 2200);
          } catch (err) {
            // Fallback for non-https/unsupported environments
            const tempInput = document.createElement('input');
            tempInput.value = code;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            btn.textContent = 'COPIED! ✓';
            btn.classList.add('is-copied');
            setTimeout(() => {
              btn.textContent = 'COPY';
              btn.classList.remove('is-copied');
            }, 2200);
          }
        });
      });
    }

    /* 2. Interactive Pincode Delivery Date Estimator */
    initPincodeChecker() {
      const cards = document.querySelectorAll('.sugar-pincode-card:not([data-pincode-bound])');
      cards.forEach((card) => {
        card.setAttribute('data-pincode-bound', 'true');
        const input = card.querySelector('.sugar-pincode-input');
        const btn = card.querySelector('.sugar-pincode-btn');
        const result = card.querySelector('.sugar-pincode-result');
        const dateEl = card.querySelector('.sugar-delivery-date');

        if (!input || !btn || !result) return;

        // Restore saved pincode if present
        const savedPincode = localStorage.getItem('sugar_pincode');
        if (savedPincode) {
          input.value = savedPincode;
          this.calculateDeliveryDate(dateEl);
          result.style.display = 'block';
        }

        const runCheck = () => {
          const val = input.value.trim();
          if (val.length >= 4) {
            localStorage.setItem('sugar_pincode', val);
            btn.textContent = 'CHECKING...';
            setTimeout(() => {
              btn.textContent = 'CHECK';
              this.calculateDeliveryDate(dateEl);
              result.style.display = 'block';
            }, 300);
          } else {
            input.focus();
            input.style.borderColor = '#E11D48';
            setTimeout(() => {
              input.style.borderColor = '';
            }, 1200);
          }
        };

        btn.addEventListener('click', runCheck);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            runCheck();
          }
        });
      });
    }

    calculateDeliveryDate(dateEl) {
      if (!dateEl) return;
      const today = new Date();
      // Add 3-4 business days
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 3);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[deliveryDate.getDay()];
      const monthName = months[deliveryDate.getMonth()];
      const dayNum = deliveryDate.getDate();

      dateEl.textContent = `${dayName}, ${monthName} ${dayNum}`;
    }

    /* 3. Floating Wishlist Heart Toggle */
    initWishlist() {
      const wishlistBtns = document.querySelectorAll('.sugar-wishlist-btn:not([data-wishlist-bound])');
      const savedWishlist = JSON.parse(localStorage.getItem('sugar_wishlist') || '[]');

      wishlistBtns.forEach((btn) => {
        btn.setAttribute('data-wishlist-bound', 'true');
        const productId = btn.getAttribute('data-product-id');

        if (savedWishlist.includes(productId)) {
          btn.classList.add('is-active');
          btn.innerHTML = '❤️';
        }

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          let currentList = JSON.parse(localStorage.getItem('sugar_wishlist') || '[]');
          if (btn.classList.contains('is-active')) {
            btn.classList.remove('is-active');
            btn.innerHTML = '♡';
            currentList = currentList.filter((id) => id !== productId);
          } else {
            btn.classList.add('is-active');
            btn.innerHTML = '❤️';
            if (!currentList.includes(productId)) {
              currentList.push(productId);
            }
          }
          localStorage.setItem('sugar_wishlist', JSON.stringify(currentList));
        });
      });
    }

    /* 4. Sticky Bottom "Add to Bag" Bar on Scroll */
    initStickyBuyBar() {
      const stickyBar = document.getElementById('SugarStickyBar');
      if (!stickyBar) return;

      const triggerTarget = document.querySelector('.product-form__buttons, .product__info-container .product-form');
      if (!triggerTarget) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When main CTA scrolls above the viewport, show sticky bar
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
              stickyBar.classList.add('is-visible');
            } else {
              stickyBar.classList.remove('is-visible');
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(triggerTarget);

      // Handle click on sticky Add to Bag button
      const stickyBtn = stickyBar.querySelector('.sugar-sticky-btn');
      if (stickyBtn && !stickyBtn.hasAttribute('data-bound')) {
        stickyBtn.setAttribute('data-bound', 'true');
        stickyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const mainSubmitBtn = document.querySelector('.product-form__buttons button[type="submit"], .product-form__submit');
          if (mainSubmitBtn) {
            mainSubmitBtn.click();
          } else {
            // Direct AJAX add fallback
            const variantSelect = stickyBar.querySelector('.sugar-sticky-variant-select');
            const variantId = variantSelect ? variantSelect.value : stickyBar.getAttribute('data-variant-id');
            if (variantId) {
              fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [{ id: parseInt(variantId), quantity: 1 }] })
              })
                .then((res) => res.json())
                .then(() => {
                  const cartDrawer = document.querySelector('cart-drawer');
                  if (cartDrawer && typeof cartDrawer.open === 'function') {
                    cartDrawer.open();
                  } else {
                    window.location.href = '/cart';
                  }
                });
            }
          }
        });
      }
    }

    /* 5. Desktop Vertical Thumbnail Hover Preview */
    initVerticalThumbnailsHover() {
      const thumbnails = document.querySelectorAll(
        '.product--thumbnail .thumbnail-list__item button, .product--thumbnail_slider .thumbnail-list__item button'
      );
      thumbnails.forEach((thumbBtn) => {
        if (thumbBtn.hasAttribute('data-hover-switch-bound')) return;
        thumbBtn.setAttribute('data-hover-switch-bound', 'true');

        // On desktop, hover switches the slide seamlessly
        thumbBtn.addEventListener('mouseenter', () => {
          if (window.innerWidth >= 990) {
            thumbBtn.click();
          }
        });
      });
    }

    /* 6. Dynamic Free Shipping Tier in Cart Drawer */
    updateCartShippingBar(cart) {
      if (!cart) return;
      const bar = document.querySelector('.sugar-cart-shipping-bar');
      if (!bar) return;

      const threshold = parseInt(bar.getAttribute('data-threshold') || '4000'); // $40.00
      const total = cart.total_price;
      const remaining = threshold - total;
      const percent = Math.min(100, Math.round((total / threshold) * 100));

      const fill = bar.querySelector('.sugar-shipping-fill');
      const msg = bar.querySelector('.sugar-shipping-msg');

      if (fill) fill.style.width = `${percent}%`;

      if (msg) {
        if (remaining > 0) {
          const formattedRemaining = (remaining / 100).toFixed(2);
          msg.innerHTML = `Add <strong>$${formattedRemaining}</strong> more to unlock <strong>FREE Express Shipping</strong>! 🚚`;
        } else {
          msg.innerHTML = `<span class="unlocked">🎉 You've unlocked <strong>FREE Express Shipping</strong>!</span>`;
        }
      }
    }
  }

  window.SugarCosmeticsFeaturesInstance = new SugarCosmeticsFeatures();
})();
