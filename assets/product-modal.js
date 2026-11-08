if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
      }

      hide() {
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();
        this.syncAadameMedia(opener);
      }

      syncAadameMedia(opener) {
        try {
          const openerContainer = opener ? opener.closest('.product__modal-opener') : null;
          const openerImg = (openerContainer ? openerContainer.querySelector('.product__media img') : null) || document.querySelector('.product__media.aadame-zoom-container img');
          const targetId = this.openedBy ? this.openedBy.getAttribute('data-media-id') : null;
          const activeMedia = targetId ? this.querySelector(`[data-media-id="${targetId}"]`) : null;
          const modalImages = this.querySelectorAll('.product-media-modal__content img');

          if (openerImg) {
            const activeSrc = openerImg.getAttribute('data-zoom-src') || openerImg.getAttribute('src');
            if (activeSrc && !activeSrc.includes('no-image')) {
              if (activeMedia && activeMedia.tagName === 'IMG') {
                activeMedia.src = activeSrc;
                activeMedia.removeAttribute('srcset');
              } else if (modalImages.length > 0) {
                modalImages[0].src = activeSrc;
                modalImages[0].removeAttribute('srcset');
              }
            }
          }
        } catch (e) {
          console.warn('Aadame media modal sync:', e);
        }
      }

      showActiveMedia() {
        this.querySelectorAll(
          `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute('data-media-id')}"])`
        ).forEach((element) => {
          element.classList.remove('active');
        });
        const activeMedia = this.querySelector(`[data-media-id="${this.openedBy.getAttribute('data-media-id')}"]`);
        const activeMediaTemplate = activeMedia.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        activeMedia.classList.add('active');
        activeMedia.scrollIntoView();

        const container = this.querySelector('[role="document"]');
        container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;

        if (
          activeMedia.nodeName == 'DEFERRED-MEDIA' &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        )
          activeMedia.loadContent();
      }
    }
  );
}
