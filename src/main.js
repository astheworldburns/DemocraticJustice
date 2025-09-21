import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initShare } from './share.js';
import { initReviewForm } from './review-form.js';
import { initFeedback } from './feedback.js';

// Initialize theme immediately to prevent flash
initTheme();

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initReviewForm();
  initShare();
  initFeedback();
});

// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => {
    console.error('Service worker registration failed:', err);
  });
}