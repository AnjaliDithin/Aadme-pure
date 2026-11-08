/**
 * Aadame Pure Homepage Interactive Animations & Video Engine
 * - Floating Dew Particle Canvas on Hero
 * - Video sound and playback controls
 * - Interactive Before/After Split-Screen Drag Slider
 * - Watch & Shop Video Reels
 */
(function () {
  class AadameAnimations {
    constructor() {
      this.init();
      document.addEventListener('shopify:section:load', () => this.init());
    }

    init() {
      this.initStoryReelsNav();
      this.initDewCanvas();
      this.initVideoControls();
      this.initBeforeAfterSlider();
      this.initReelsVideoHover();
      this.initVideoModal();
    }

    /* 0. Story Reels Mobile Arrow Navigation (Hidden on Desktop) */
    initStoryReelsNav() {
      const wrappers = document.querySelectorAll('.aadame-story-reels-wrapper');
      wrappers.forEach((wrapper) => {
        const track = wrapper.querySelector('.aadame-story-reels-track');
        const prevBtn = wrapper.querySelector('.aadame-story-nav-prev');
        const nextBtn = wrapper.querySelector('.aadame-story-nav-next');

        if (!track || !prevBtn || !nextBtn) return;

        const updateNavState = () => {
          const scrollLeft = track.scrollLeft;
          const maxScroll = track.scrollWidth - track.clientWidth;

          if (scrollLeft <= 8) {
            prevBtn.classList.add('is-disabled');
          } else {
            prevBtn.classList.remove('is-disabled');
          }

          if (scrollLeft >= maxScroll - 8) {
            nextBtn.classList.add('is-disabled');
          } else {
            nextBtn.classList.remove('is-disabled');
          }
        };

        if (!prevBtn.hasAttribute('data-nav-bound')) {
          prevBtn.setAttribute('data-nav-bound', 'true');
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            track.scrollBy({ left: -190, behavior: 'smooth' });
          });
        }

        if (!nextBtn.hasAttribute('data-nav-bound')) {
          nextBtn.setAttribute('data-nav-bound', 'true');
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            track.scrollBy({ left: 190, behavior: 'smooth' });
          });
        }

        track.addEventListener('scroll', updateNavState, { passive: true });
        window.addEventListener('resize', updateNavState);
        setTimeout(updateNavState, 150);
      });
    }

    /* 1. Floating Dew Particle Canvas */
    initDewCanvas() {
      const canvas = document.getElementById('AadameDewCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let width, height;
      let particles = [];
      let mouseX = -100, mouseY = -100;

      const resize = () => {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
      };

      resize();
      window.addEventListener('resize', resize);

      canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });

      // Particle class for dewy bubbles
      class DewDrop {
        constructor() {
          this.reset(true);
        }

        reset(initial) {
          this.x = Math.random() * width;
          this.y = initial ? Math.random() * height : height + 20;
          this.radius = Math.random() * 3.5 + 1.2;
          this.speedY = Math.random() * 0.6 + 0.25;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.alpha = Math.random() * 0.4 + 0.15;
          this.wobble = Math.random() * Math.PI * 2;
        }

        update() {
          this.y -= this.speedY;
          this.wobble += 0.02;
          this.x += Math.sin(this.wobble) * 0.4 + this.speedX;

          // Gentle mouse repulsion
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            this.x += (dx / dist) * 1.5;
            this.y += (dy / dist) * 1.5;
          }

          if (this.y < -20 || this.x < -20 || this.x > width + 20) {
            this.reset(false);
          }
        }

        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(243, 229, 171, ${this.alpha})`;
          ctx.fill();

          // Highlight glint
          ctx.beginPath();
          ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 1.5})`;
          ctx.fill();
        }
      }

      particles = Array.from({ length: 45 }, () => new DewDrop());

      let animId;
      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
          p.update();
          p.draw();
        });
        animId = requestAnimationFrame(animate);
      };

      animate();
    }

    /* 2. Video Banner Controls */
    initVideoControls() {
      const video = document.getElementById('AadameHeroVideo');
      const soundBtn = document.getElementById('AadameVideoSoundToggle');

      if (!video || !soundBtn) return;

      soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        soundBtn.innerHTML = video.muted ? '🔇' : '🔊';
        soundBtn.setAttribute('title', video.muted ? 'Unmute video' : 'Mute video');
      });
    }

    /* 3. Interactive Before/After Split-Screen Slider */
    initBeforeAfterSlider() {
      const containers = document.querySelectorAll('.aadame-ba-container:not([data-ba-bound])');

      containers.forEach((container) => {
        container.setAttribute('data-ba-bound', 'true');
        const beforeWrapper = container.querySelector('.aadame-ba-img-before-wrapper');
        const handle = container.querySelector('.aadame-ba-handle');
        const beforeImg = container.querySelector('.aadame-ba-img-before');

        if (!beforeWrapper || !handle) return;

        const updateWidth = () => {
          if (beforeImg) {
            beforeImg.style.width = `${container.offsetWidth}px`;
          }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);

        let isDragging = false;

        const setPosition = (clientX) => {
          const rect = container.getBoundingClientRect();
          let x = clientX - rect.left;
          x = Math.max(0, Math.min(rect.width, x));
          const percent = (x / rect.width) * 100;

          beforeWrapper.style.width = `${percent}%`;
          handle.style.left = `${percent}%`;
        };

        const onStart = (e) => {
          isDragging = true;
          const clientX = e.clientX || (e.touches && e.touches[0].clientX);
          setPosition(clientX);
        };

        const onMove = (e) => {
          if (!isDragging) return;
          const clientX = e.clientX || (e.touches && e.touches[0].clientX);
          setPosition(clientX);
        };

        const onEnd = () => {
          isDragging = false;
        };

        container.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        container.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
      });
    }

    /* 4. Watch & Shop Video Reels Hover & Quick Add */
    initReelsVideoHover() {
      const cards = document.querySelectorAll('.aadame-reel-card');
      cards.forEach((card) => {
        const video = card.querySelector('.aadame-reel-video');
        if (!video) return;

        card.addEventListener('mouseenter', () => {
          video.play().catch(() => {});
        });

        card.addEventListener('mouseleave', () => {
          video.pause();
        });

        // Quick add to bag button on reel
        const buyBtn = card.querySelector('.aadame-reel-buy-btn');
        if (buyBtn && !buyBtn.hasAttribute('data-bound')) {
          buyBtn.setAttribute('data-bound', 'true');
          buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const variantId = buyBtn.getAttribute('data-variant-id');
            const originalText = buyBtn.textContent;
            buyBtn.textContent = 'ADDING...';

            fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: [{ id: parseInt(variantId || '1'), quantity: 1 }] })
            })
              .then((res) => res.json())
              .then(() => {
                buyBtn.textContent = 'ADDED! ✓';
                setTimeout(() => {
                  buyBtn.textContent = originalText;
                }, 2000);

                const cartDrawer = document.querySelector('cart-drawer');
                if (cartDrawer && typeof cartDrawer.open === 'function') {
                  cartDrawer.open();
                } else {
                  window.location.href = '/cart';
                }
              })
              .catch(() => {
                window.location.href = '/collections/all';
              });
          });
        }
      });
    }

    /* 5. Fullwidth Video Popup Modal */
    initVideoModal() {
      const openBtn = document.getElementById('AadameWatchRitualsBtn');
      const modal = document.getElementById('AadameVideoModal');
      const closeBtn = document.getElementById('AadameVideoModalClose');
      const backdrop = modal ? modal.querySelector('.aadame-video-modal-backdrop') : null;
      const player = document.getElementById('AadameModalPlayer');

      if (!openBtn || !modal || !player) return;

      const openModal = () => {
        modal.removeAttribute('hidden');
        requestAnimationFrame(() => {
          modal.classList.add('is-active');
          document.body.style.overflow = 'hidden';
          player.currentTime = 0;
          player.play().catch(() => {});
        });
      };

      const closeModal = () => {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
        player.pause();
        setTimeout(() => {
          if (!modal.classList.contains('is-active')) {
            modal.setAttribute('hidden', 'true');
          }
        }, 350);
      };

      if (!openBtn.hasAttribute('data-modal-bound')) {
        openBtn.setAttribute('data-modal-bound', 'true');
        openBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openModal();
        });
      }

      if (closeBtn && !closeBtn.hasAttribute('data-modal-bound')) {
        closeBtn.setAttribute('data-modal-bound', 'true');
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          closeModal();
        });
      }

      if (backdrop && !backdrop.hasAttribute('data-modal-bound')) {
        backdrop.setAttribute('data-modal-bound', 'true');
        backdrop.addEventListener('click', (e) => {
          e.preventDefault();
          closeModal();
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-active')) {
          closeModal();
        }
      });
    }
  }

  window.AadameAnimationsInstance = new AadameAnimations();
})();
