class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.active = false;
    this.boundKeyHandler = null;
    this.previouslyFocusedElement = null;
  }

  activate() {
    if (this.active) return;

    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.focus === 'function') {
      this.previouslyFocusedElement = activeElement;
    } else {
      this.previouslyFocusedElement = null;
    }

    this.focusableElements = this.element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;

    if (!this.boundKeyHandler) {
      this.boundKeyHandler = this.handleKeyDown.bind(this);
    }

    this.element.addEventListener('keydown', this.boundKeyHandler);
    this.firstFocusable?.focus();
    this.active = true;
  }

  deactivate() {
    if (!this.active) return;
    if (this.boundKeyHandler) {
      this.element.removeEventListener('keydown', this.boundKeyHandler);
    }

    const modalElement = this.element;

    const focusFallback = () => {
      const primaryNavLink = document.querySelector('.nav-links a');
      if (primaryNavLink && typeof primaryNavLink.focus === 'function') {
        primaryNavLink.focus();
        return;
      }

      const fallback = document.querySelector('a[href], button:not([disabled])');
      if (fallback && typeof fallback.focus === 'function') {
        fallback.focus();
      }
    };

    const canFocusElement = (element) => {
      if (!element || typeof element.focus !== 'function') {
        return false;
      }

      const isConnected =
        typeof element.isConnected === 'boolean' ? element.isConnected : document.body.contains(element);

      if (!isConnected) {
        return false;
      }

      const isHidden = element.hasAttribute('aria-hidden') || element.getAttribute('hidden') !== null;
      const isDisabled = 'disabled' in element && element.disabled;
      const isVisible =
        typeof element.getClientRects === 'function' ? element.getClientRects().length > 0 : element.offsetParent !== null;

      return !isHidden && !isDisabled && isVisible;
    };

    const openerId = modalElement?.dataset?.openerId;
    if (openerId) {
      const storedTrigger = document.getElementById(openerId);
      if (canFocusElement(storedTrigger)) {
        storedTrigger.focus();
      } else if (canFocusElement(this.previouslyFocusedElement)) {
        this.previouslyFocusedElement.focus();
      } else {
        focusFallback();
      }
    } else if (canFocusElement(this.previouslyFocusedElement)) {
      this.previouslyFocusedElement.focus();
    } else {
      focusFallback();
    }

    if (modalElement?.dataset) {
      delete modalElement.dataset.openerId;
    }

    this.previouslyFocusedElement = null;
    this.active = false;
  }

  handleKeyDown(event) {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          event.preventDefault();
          this.lastFocusable?.focus();
        }
      } else if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }

    if (event.key === 'Escape') {
      const modal = this.element.closest('.modal');
      if (modal) {
        closeModal(modal);
      }
    }
  }
}

const focusTrapMap = new WeakMap();
let modalTriggerIdCounter = 0;
let triggerHandlerBound = false;

const getFocusTrap = (modal) => {
  let trap = focusTrapMap.get(modal);
  if (!trap) {
    trap = new FocusTrap(modal);
    focusTrapMap.set(modal, trap);
  }
  return trap;
};

const ensureTriggerId = (trigger) => {
  if (!trigger.id) {
    modalTriggerIdCounter += 1;
    trigger.id = `modal-trigger-${modalTriggerIdCounter}`;
  }
  return trigger.id;
};

const openModal = (modal, trigger) => {
  if (trigger) {
    const triggerId = ensureTriggerId(trigger);
    modal.dataset.openerId = triggerId;
  }

  modal.removeAttribute('hidden');
  modal.classList.add('active');
  document.body.classList.add('body--modal-open');

  const trap = getFocusTrap(modal);
  trap.activate();

  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
};

const closeModal = (modal) => {
  const trap = getFocusTrap(modal);
  trap.deactivate();

  modal.classList.remove('active');
  modal.setAttribute('hidden', '');
  document.body.classList.remove('body--modal-open');
};

const bindTriggerEvents = () => {
  if (triggerHandlerBound) return;
  triggerHandlerBound = true;

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-modal-target]');
    if (!trigger) return;

    const modalId = trigger.dataset.modalTarget;
    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    event.preventDefault();
    openModal(modal, trigger);
  });
};

export function initModals() {
  const modals = document.querySelectorAll('.modal');
  if (!modals.length) return;

  bindTriggerEvents();

  modals.forEach((modal) => {
    const trap = getFocusTrap(modal);

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => closeModal(modal));

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

    // If the modal was already open when this module loads, ensure focus trap is active.
    if (modal.classList.contains('active') && !modal.hasAttribute('hidden')) {
      trap.activate();
    }
  });
}

export { closeModal };
