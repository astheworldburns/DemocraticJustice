import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';

// Initialize theme immediately to prevent flash
initTheme();

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();

  if (document.querySelector('[data-form-id]')) {
    import('./review-form.js')
      .then((module) => module.initReviewForm())
      .catch((error) => console.error('Failed to load review form module', error));
  }

  if (
    document.getElementById('share-btn-native') ||
    document.getElementById('print-btn') ||
    document.querySelector('form#secure-contact')
  ) {
    import('./share.js')
      .then((module) => module.initShare())
      .catch((error) => console.error('Failed to load share module', error));
  }

  if (document.querySelector('[data-feedback-form]')) {
    import('./feedback.js')
      .then((module) => module.initFeedback())
      .catch((error) => console.error('Failed to load feedback module', error));
  }

  if (document.querySelector('.modal')) {
    import('./modals.js')
      .then((module) => module.initModals())
      .catch((error) => console.error('Failed to load modals module', error));
  }
});

// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => {
    console.error('Service worker registration failed:', err);
  });
}