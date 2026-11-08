if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.mql = window.matchMedia('(min-width: 750px)');
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          button: this.querySelector('button.localization-form__select'),
          panel: this.querySelector('.disclosure__list-wrapper'),
          search: this.querySelector('input[name="country_filter"]'),
          closeButton: this.querySelector('.country-selector__close-button'),
          resetButton: this.querySelector('.country-filter__reset-button'),
          searchIcon: this.querySelector('.country-filter__search-icon'),
          liveRegion: this.querySelector('#sr-country-search-results'),
        };

        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        this.addEventListener('keydown', this.onContainerKeyDown.bind(this));

        // Click on the button toggles the dropdown cleanly
        if (this.elements.button) {
          this.elements.button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.elements.panel && this.elements.panel.hasAttribute('hidden')) {
              this.openSelector();
            } else {
              this.hidePanel();
            }
          });
        }

        // Close when clicking outside of this localization component
        document.addEventListener('click', (e) => {
          if (!this.contains(e.target)) {
            this.hidePanel();
          }
        });

        // Safe focusout that doesn't falsely close on relatedTarget == null
        this.addEventListener('focusout', (event) => {
          if (event.relatedTarget && !this.contains(event.relatedTarget)) {
            this.hidePanel();
          }
        });

        if (this.elements.search) {
          this.elements.search.addEventListener('keyup', this.filterCountries.bind(this));
          this.elements.search.addEventListener('focus', this.onSearchFocus.bind(this));
          this.elements.search.addEventListener('blur', this.onSearchBlur.bind(this));
          this.elements.search.addEventListener('keydown', this.onSearchKeyDown.bind(this));
        }
        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.hidePanel();
          });
        }
        if (this.elements.resetButton) {
          this.elements.resetButton.addEventListener('click', this.resetFilter.bind(this));
          this.elements.resetButton.addEventListener('mousedown', (event) => event.preventDefault());
        }

        this.querySelectorAll('a').forEach((item) => item.addEventListener('click', this.onItemClick.bind(this)));

        // Restore saved country choice from localStorage if present
        try {
          const saved = JSON.parse(localStorage.getItem('aadame_selected_country') || 'null');
          if (saved && saved.name && this.elements.button) {
            const btnSpan = this.elements.button.querySelector('span');
            if (btnSpan) {
              btnSpan.textContent = `${saved.name} | ${saved.currency}`;
            }
          }
        } catch (e) {}
      }

      hidePanel() {
        if (!this.elements.panel) return;
        this.elements.panel.setAttribute('hidden', 'true');
        if (this.elements.button) {
          this.elements.button.setAttribute('aria-expanded', 'false');
        }
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.setAttribute('aria-activedescendant', '');
        }
        document.body.classList.remove('overflow-hidden-mobile');
        const menuDrawer = document.querySelector('.menu-drawer');
        if (menuDrawer) {
          menuDrawer.classList.remove('country-selector-open');
        }
        if (this.header) {
          this.header.preventHide = false;
        }
      }

      openSelector() {
        if (!this.elements.panel) return;
        this.elements.panel.removeAttribute('hidden');
        if (this.elements.button) {
          this.elements.button.setAttribute('aria-expanded', 'true');
        }
        if (!document.body.classList.contains('overflow-hidden-tablet')) {
          document.body.classList.add('overflow-hidden-mobile');
        }
        if (this.elements.search && this.mql.matches) {
          this.elements.search.focus();
        }
        if (this.header && this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
        const menuDrawer = document.querySelector('.menu-drawer');
        if (menuDrawer) {
          menuDrawer.classList.add('country-selector-open');
        }
      }

      onContainerKeyDown(event) {
        const focusableItems = Array.from(this.querySelectorAll('a')).filter(
          (item) => !item.parentElement.classList.contains('hidden')
        );
        let focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
        let itemToFocus;

        switch (event.code.toUpperCase()) {
          case 'ARROWUP':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
            itemToFocus.focus();
            break;
          case 'ARROWDOWN':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
            itemToFocus.focus();
            break;
        }

        if (!this.elements.search) return;

        setTimeout(() => {
          focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
          if (focusedItemIndex > -1) {
            this.elements.search.setAttribute('aria-activedescendant', focusableItems[focusedItemIndex].id);
          } else {
            this.elements.search.setAttribute('aria-activedescendant', '');
          }
        });
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button && this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            if (this.elements.button) this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button && this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      onItemClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const form = this.querySelector('form');
        const selectedValue = event.currentTarget.dataset.value;
        const countryName = (event.currentTarget.querySelector('.country')?.textContent || '').trim();
        const currencyText = (event.currentTarget.querySelector('.localization-form__currency')?.textContent || '').trim();

        try {
          localStorage.setItem('aadame_selected_country', JSON.stringify({
            code: selectedValue,
            name: countryName,
            currency: currencyText
          }));
        } catch (e) {}

        if (this.elements.button && countryName) {
          const btnSpan = this.elements.button.querySelector('span');
          if (btnSpan) {
            btnSpan.textContent = `${countryName} | ${currencyText}`;
          }
        }

        if (this.elements.input) {
          this.elements.input.value = selectedValue;
        }

        this.hidePanel();

        if (form) form.submit();
      }

      normalizeString(str) {
        return str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
      }

      filterCountries() {
        const searchValue = this.normalizeString(this.elements.search.value);
        const popularCountries = this.querySelector('.popular-countries');
        const allCountries = this.querySelectorAll('a');
        let visibleCountries = allCountries.length;

        if (this.elements.resetButton) {
          this.elements.resetButton.classList.toggle('hidden', !searchValue);
        }

        if (popularCountries) {
          popularCountries.classList.toggle('hidden', searchValue);
        }

        allCountries.forEach((item) => {
          const countrySpan = item.querySelector('.country');
          if (!countrySpan) return;
          const countryName = this.normalizeString(countrySpan.textContent);
          if (countryName.indexOf(searchValue) > -1) {
            item.parentElement.classList.remove('hidden');
            visibleCountries++;
          } else {
            item.parentElement.classList.add('hidden');
            visibleCountries--;
          }
        });

        if (this.elements.liveRegion) {
          this.elements.liveRegion.innerHTML = (window.accessibilityStrings?.countrySelectorSearchCount || '[count] found').replace(
            '[count]',
            visibleCountries
          );
        }

        const selectorEl = this.querySelector('.country-selector');
        if (selectorEl) selectorEl.scrollTop = 0;
        const listEl = this.querySelector('.country-selector__list');
        if (listEl) listEl.scrollTop = 0;
      }

      resetFilter(event) {
        event.stopPropagation();
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.focus();
        }
      }

      onSearchFocus() {
        if (this.elements.searchIcon) {
          this.elements.searchIcon.classList.add('country-filter__search-icon--hidden');
        }
      }

      onSearchBlur() {
        if (this.elements.searchIcon && (!this.elements.search || !this.elements.search.value)) {
          this.elements.searchIcon.classList.remove('country-filter__search-icon--hidden');
        }
      }

      onSearchKeyDown(event) {
        if (event.code.toUpperCase() === 'ENTER') {
          event.preventDefault();
        }
      }
    }
  );
}
