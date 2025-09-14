import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initShare } from './share.js';

// Initialize theme immediately to prevent flash
initTheme();

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initShare();
});

// Service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => {
    console.error('Service worker registration failed:', err);
  });
}