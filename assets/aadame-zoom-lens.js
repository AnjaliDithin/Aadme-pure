/**
 * Aadame Pure Luxury Zoom Lens Engine
 * High-performance, silky smooth 60fps pan & zoom (2.2x) on PRIMARY active product media
 * Non-intrusive: zero visual obstruction, 100% image clarity
 * Thumbnails smoothly swap into the main image on click and activate silky smooth zoom
 */
(function () {
  class AadameZoomLens {
    constructor() {
      this.init();
      document.addEventListener('shopify:section:load', () => this.init());
      document.addEventListener('quick-add:loaded', () => this.init());
      document.addEventListener('variant:change', () => this.init());

      // Listen for slide change events from Dawn's gallery slider
      document.addEventListener('slideChanged', () => {
        setTimeout(() => this.init(), 50);
      });

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            this.init();
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    init() {
      // 1. Clean up any rogue loupe elements if present
      document.querySelectorAll('.aadame-zoom-loupe').forEach((el) => el.remove());

      // 2. Connect thumbnail click handlers (both thumbnail strip and stacked secondary items)
      this.bindThumbnailSwitchers();

      // 3. Attach zoom engine to all main viewer slides
      // In thumbnail/slider mode, multiple slides exist, and each slide has smooth zoom when active
      const mediaList = document.querySelectorAll(
        '.product__media-list > .product__media-item .product__media, quick-add-modal .product__media'
      );

      // Fallback if list structure differs
      const targets = mediaList.length > 0 ? mediaList : document.querySelectorAll('.product__media');

      targets.forEach((container) => {
        const slideItem = container.closest('.product__media-item');
        const isSecondaryInStacked = slideItem && slideItem.parentElement &&
          slideItem.parentElement.children[0] !== slideItem &&
          document.querySelector('.product--stacked, .product--columns, [data-desktop-layout="stacked"], [data-desktop-layout="columns"]');

        // Never bind zoom to secondary items in stacked/columns layout
        if (isSecondaryInStacked) {
          const parentOpener = container.closest('.product__modal-opener') || container.parentElement;
          if (parentOpener) {
            parentOpener.querySelectorAll('.aadame-zoom-badge').forEach((b) => b.remove());
          }
          container.querySelectorAll('.aadame-zoom-badge').forEach((b) => b.remove());
          return;
        }

        if (container.hasAttribute('data-zoom-lens-bound')) return;

        const img = container.querySelector('img');
        if (!img) return;

        container.setAttribute('data-zoom-lens-bound', 'true');
        container.classList.add('aadame-zoom-container');

        // Append badge outside the .media element onto opener with strict bounds
        const parentOpener = container.closest('.product__modal-opener') || container.parentElement;
        let badge = (parentOpener || container).querySelector('.aadame-zoom-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'aadame-zoom-badge zoom';
          badge.innerHTML = '<span class="zoom-icon">🔍</span> <span class="zoom-text">Hover to Zoom</span>';
          if (parentOpener && parentOpener !== container) {
            parentOpener.style.position = 'relative';
            parentOpener.appendChild(badge);
          } else {
            container.appendChild(badge);
          }
        }

        let isHovering = false;
        let rafId = null;
        let currentX = 50, currentY = 50;
        let targetX = 50, targetY = 50;

        const updateZoomOrigin = () => {
          if (!isHovering) return;
          // Smooth 60fps interpolation (lerp)
          currentX += (targetX - currentX) * 0.22;
          currentY += (targetY - currentY) * 0.22;

          const activeImg = container.querySelector('img');
          if (activeImg) {
            activeImg.style.transformOrigin = `${currentX.toFixed(2)}% ${currentY.toFixed(2)}%`;
            activeImg.style.transform = 'scale(2.2)';
          }

          rafId = requestAnimationFrame(updateZoomOrigin);
        };

        const onMouseEnter = (e) => {
          isHovering = true;
          container.classList.add('is-zooming');
          badge.classList.add('is-active');
          badge.querySelector('.zoom-text').textContent = '2.2× Zoom Active';

          const rect = container.getBoundingClientRect();
          const clientX = e.clientX || (e.touches && e.touches[0].clientX) || rect.left + rect.width / 2;
          const clientY = e.clientY || (e.touches && e.touches[0].clientY) || rect.top + rect.height / 2;

          targetX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
          targetY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
          currentX = targetX;
          currentY = targetY;

          const activeImg = container.querySelector('img');
          if (activeImg) {
            activeImg.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)';
            activeImg.style.transformOrigin = `${currentX}% ${currentY}%`;
            activeImg.style.transform = 'scale(2.2)';
          }

          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(updateZoomOrigin);
        };

        const onMouseMove = (e) => {
          if (!isHovering) {
            onMouseEnter(e);
            return;
          }

          const rect = container.getBoundingClientRect();
          const clientX = e.clientX || (e.touches && e.touches[0].clientX);
          const clientY = e.clientY || (e.touches && e.touches[0].clientY);
          if (clientX === undefined || clientY === undefined) return;

          targetX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
          targetY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
        };

        const onMouseLeave = () => {
          isHovering = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }

          container.classList.remove('is-zooming');
          badge.classList.remove('is-active');
          badge.querySelector('.zoom-text').textContent = 'Hover to Zoom';

          const activeImg = container.querySelector('img');
          if (activeImg) {
            activeImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.35s ease';
            activeImg.style.transform = 'scale(1)';
            activeImg.style.transformOrigin = 'center center';
          }
        };

        const targetEl = parentOpener || container;
        targetEl.addEventListener('mouseenter', onMouseEnter);
        targetEl.addEventListener('mousemove', onMouseMove);
        targetEl.addEventListener('mouseleave', onMouseLeave);
        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mouseleave', onMouseLeave);

        // Mobile touch handling
        targetEl.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            onMouseEnter(e);
          }
        }, { passive: true });

        targetEl.addEventListener('touchmove', (e) => {
          if (isHovering && e.touches.length === 1) {
            onMouseMove(e);
          }
        }, { passive: true });

        targetEl.addEventListener('touchend', () => {
          onMouseLeave();
        });
      });

      // 4. Also enable smooth zoom inside product media modal
      const modalMediaList = document.querySelectorAll(
        '.product-media-modal__content img:not([data-zoom-lens-bound])'
      );
      modalMediaList.forEach((modalImg) => {
        modalImg.setAttribute('data-zoom-lens-bound', 'true');
        modalImg.style.cursor = 'crosshair';
        modalImg.style.willChange = 'transform, transform-origin';

        let modalHover = false;
        let mRaf = null;
        let mCurrentX = 50, mCurrentY = 50;
        let mTargetX = 50, mTargetY = 50;

        const updateModalZoom = () => {
          if (!modalHover) return;
          mCurrentX += (mTargetX - mCurrentX) * 0.22;
          mCurrentY += (mTargetY - mCurrentY) * 0.22;
          modalImg.style.transformOrigin = `${mCurrentX.toFixed(2)}% ${mCurrentY.toFixed(2)}%`;
          modalImg.style.transform = 'scale(2.2)';
          mRaf = requestAnimationFrame(updateModalZoom);
        };

        modalImg.addEventListener('mouseenter', (e) => {
          modalHover = true;
          const rect = modalImg.getBoundingClientRect();
          mTargetX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          mTargetY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
          mCurrentX = mTargetX;
          mCurrentY = mTargetY;
          modalImg.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)';
          modalImg.style.transformOrigin = `${mCurrentX}% ${mCurrentY}%`;
          modalImg.style.transform = 'scale(2.2)';
          if (mRaf) cancelAnimationFrame(mRaf);
          mRaf = requestAnimationFrame(updateModalZoom);
        });

        modalImg.addEventListener('mousemove', (e) => {
          if (!modalHover) return;
          const rect = modalImg.getBoundingClientRect();
          mTargetX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          mTargetY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        });

        modalImg.addEventListener('mouseleave', () => {
          modalHover = false;
          if (mRaf) cancelAnimationFrame(mRaf);
          modalImg.style.transition = 'transform 0.35s ease';
          modalImg.style.transform = 'scale(1)';
          modalImg.style.transformOrigin = 'center center';
        });
      });
    }

    bindThumbnailSwitchers() {
      // 1. Thumbnail buttons in thumbnail strip (Dawn MediaGallery)
      const thumbButtons = document.querySelectorAll(
        '.thumbnail-list__item button:not([data-thumbnail-bound]), .thumbnail:not([data-thumbnail-bound])'
      );
      thumbButtons.forEach((btn) => {
        btn.setAttribute('data-thumbnail-bound', 'true');
        btn.addEventListener('click', () => {
          // Reset previous zoom state on active media when switching
          setTimeout(() => {
            const activeSlide = document.querySelector('.product__media-item.is-active, .product__media-item:first-child');
            if (activeSlide) {
              const activeImg = activeSlide.querySelector('img');
              if (activeImg) {
                activeImg.style.transform = 'scale(1)';
                activeImg.style.transformOrigin = 'center center';
              }
            }
          }, 50);
        });
      });

      // 2. Secondary items in stacked layout (clicking a secondary card sends it to the main top viewer)
      const secondaryItems = document.querySelectorAll(
        '.product__media-list > .product__media-item:not(:first-child):not([data-secondary-bound])'
      );
      secondaryItems.forEach((secItem) => {
        secItem.setAttribute('data-secondary-bound', 'true');
        secItem.style.cursor = 'pointer';

        // Strip any badge inside secondary item
        secItem.querySelectorAll('.aadame-zoom-badge').forEach((b) => b.remove());

        secItem.addEventListener('click', (e) => {
          const clickedImg = secItem.querySelector('img');
          const mainItem = document.querySelector('.product__media-list > .product__media-item:first-child');
          const mainImg = mainItem ? mainItem.querySelector('img') : null;

          if (clickedImg && mainImg) {
            e.preventDefault();
            e.stopPropagation();

            const newSrc = clickedImg.getAttribute('data-zoom-src') || clickedImg.getAttribute('src');
            const prevSrc = mainImg.getAttribute('data-zoom-src') || mainImg.src;
            const prevAlt = mainImg.alt;

            // Quick crossfade to swap into main viewer
            mainImg.style.transition = 'opacity 0.15s ease, transform 0.2s ease';
            mainImg.style.opacity = '0.7';

            mainImg.src = newSrc;
            mainImg.setAttribute('data-zoom-src', newSrc);
            if (clickedImg.alt) mainImg.alt = clickedImg.alt;

            // Swap clicked thumbnail to hold previous main image for instant round-trip toggle
            clickedImg.style.transition = 'opacity 0.15s ease';
            clickedImg.style.opacity = '0.7';
            clickedImg.src = prevSrc;
            clickedImg.setAttribute('data-zoom-src', prevSrc);
            if (prevAlt) clickedImg.alt = prevAlt;

            mainImg.style.transform = 'scale(1)';
            mainImg.style.transformOrigin = 'center center';

            setTimeout(() => {
              mainImg.style.opacity = '1';
              clickedImg.style.opacity = '1';
            }, 100);

            // Highlight active thumbnail
            document.querySelectorAll('.product__media-item').forEach((item) => {
              item.classList.remove('is-active-thumbnail');
            });
            secItem.classList.add('is-active-thumbnail');

            // Ensure main item badge is visible and active
            const mainBadge = mainItem.querySelector('.aadame-zoom-badge');
            if (mainBadge) {
              mainBadge.style.display = 'inline-flex';
            }

            // Smooth scroll main item into view if scrolled down
            mainItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, true);
      });
    }
  }

  window.AadameZoomLensInstance = new AadameZoomLens();
})();
