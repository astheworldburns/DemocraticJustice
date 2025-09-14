export function initShare() {
  const btn = document.getElementById('share-btn-native');
  if (!btn) return;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const shareData = {
      title: btn.dataset.shareTitle,
      text: btn.dataset.shareText,
      url: btn.dataset.shareUrl
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Ignore share cancellation
      }
    } else {
      const url = encodeURIComponent(shareData.url);
      const text = encodeURIComponent(shareData.title);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  });
}
 const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', e => {
      e.preventDefault();
      window.print();
    });
  }