export function initShare() {
  const vibrate = (pattern = 20) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (navigator.vibrate && !reduceMotion) navigator.vibrate(pattern);
  };

  const shareBtn = document.getElementById('share-btn-native');
  shareBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const shareData = {
      title: shareBtn.dataset.shareTitle,
      text: shareBtn.dataset.shareText,
      url: shareBtn.dataset.shareUrl
    };
    vibrate();
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        /* ignore */
      }
    } else {
      const url = encodeURIComponent(shareData.url);
      const text = encodeURIComponent(shareData.title);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  });

  const printBtn = document.getElementById('print-btn');
  printBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    vibrate();
    window.print();
  });

  const reviewBtn = document.getElementById('request-review-btn');
  reviewBtn?.addEventListener('click', () => vibrate());

  const forms = document.querySelectorAll('form#secure-contact');
  const errorEl = document.getElementById('cta-error');
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = new URLSearchParams(new FormData(form)).toString();
      try {
        const resp = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });
        if (resp.ok) {
          vibrate([20, 50, 20]);
          errorEl?.style?.setProperty('display', 'none');
          form.dispatchEvent(new CustomEvent('enhanced:success', { detail: { response: resp } }));

          const successSelector = form.dataset.successTarget;
          const successMessage = form.dataset.successMessage;

          if (successSelector) {
            const successEl = document.querySelector(successSelector);
            if (successEl) {
              form.setAttribute('hidden', 'true');
              successEl.hidden = false;
              successEl.focus?.();
              return;
            }
          }

          if (successMessage) {
            form.innerHTML = `<p>${successMessage}</p>`;
          } else {
            form.innerHTML = '<p>Thanks—we\'ll be in touch soon.</p>';
          }
        } else {
          errorEl?.style?.setProperty('display', 'block');
          form.dispatchEvent(new CustomEvent('enhanced:error', { detail: { response: resp } }));
        }
      } catch (err) {
        errorEl?.style?.setProperty('display', 'block');
        form.dispatchEvent(new CustomEvent('enhanced:error', { detail: { error: err } }));
      }
    });
  });
}

