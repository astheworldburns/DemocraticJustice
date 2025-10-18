let modalTriggerIdCounter = 0;
let triggerHandlerBound = false;
let openModalCount = 0;

const previouslyFocusedMap = new WeakMap();
const escapeHandlerMap = new WeakMap();

const ensureTriggerId = (trigger) => {
  if (!trigger.id) {
    modalTriggerIdCounter += 1;
    trigger.id = `modal-trigger-${modalTriggerIdCounter}`;
  }
  return trigger.id;
};

const openModal = (modal, trigger) => {
  if (!modal) {
    return;
  }

  if (trigger) {
    const triggerId = ensureTriggerId(trigger);
    modal.dataset.openerId = triggerId;
  }

  previouslyFocusedMap.set(modal, document.activeElement instanceof HTMLElement ? document.activeElement : null);

  modal.removeAttribute('hidden');
  modal.classList.add('active');
  document.body.classList.add('body--modal-open');

  openModalCount += 1;
  document.body.inert = true;
  modal.inert = false;
  modal.removeAttribute('inert');

  const focusTarget =
    modal.querySelector('[data-initial-focus]') ||
    modal.querySelector('.modal-close') ||
    modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  if (focusTarget && typeof focusTarget.focus === 'function') {
    focusTarget.focus();
  }

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
    }
  };
  document.addEventListener('keydown', handleEscape, true);
  escapeHandlerMap.set(modal, handleEscape);

  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
};

const closeModal = (modal) => {
  if (!modal) {
    return;
  }

  const handleEscape = escapeHandlerMap.get(modal);
  if (handleEscape) {
    document.removeEventListener('keydown', handleEscape, true);
    escapeHandlerMap.delete(modal);
  }

  modal.classList.remove('active');
  modal.setAttribute('hidden', '');
  document.body.classList.remove('body--modal-open');

  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.inert = false;
  }
  modal.inert = true;

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

  const focusFallback = () => {
    const primaryNavLink = document.querySelector('.nav-links a');
    if (canFocusElement(primaryNavLink)) {
      primaryNavLink.focus();
      return;
    }

    const fallback = document.querySelector('a[href], button:not([disabled])');
    if (canFocusElement(fallback)) {
      fallback.focus();
    }
  };

  const openerId = modal?.dataset?.openerId;
  let focusTarget = openerId ? document.getElementById(openerId) : null;

  if (!canFocusElement(focusTarget)) {
    focusTarget = previouslyFocusedMap.get(modal);
  }

  if (canFocusElement(focusTarget)) {
    focusTarget.focus();
  } else {
    focusFallback();
  }

  if (modal?.dataset) {
    delete modal.dataset.openerId;
  }

  previouslyFocusedMap.delete(modal);
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
    if (!modal.classList.contains('active') || modal.hasAttribute('hidden')) {
      modal.inert = true;
    }

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => closeModal(modal));

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

    if (modal.classList.contains('active') && !modal.hasAttribute('hidden')) {
      openModal(modal);
    }
  });
}

export { closeModal };
