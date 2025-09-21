(function () {
  const GA_ID = 'G-3TV2GBS34Y';

  function loadGA() {
    if (window.dataLayer) return;
    const gtagScript = document.createElement('script');
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    gtagScript.async = true;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function loadClarity() {
    const namespace = window.democraticJustice || window.DemocraticJustice;
    if (!namespace) {
      return;
    }

    const clarityLoader = typeof namespace.loadClarity === 'function' ? namespace.loadClarity : null;
    if (clarityLoader) {
      clarityLoader();
    }
  }

  const consent = localStorage.getItem('analytics-consent');
  if (consent === 'granted') {
    loadGA();
    loadClarity();
  } else if (consent !== 'denied') {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#eee;padding:1em;text-align:center;z-index:1000;';
    banner.innerHTML = '<span>We use cookies for analytics.</span> <button id="consent-accept">Accept</button> <button id="consent-reject">Reject</button>';
    document.body.appendChild(banner);
    document.getElementById('consent-accept').addEventListener('click', function(){
      localStorage.setItem('analytics-consent','granted');
      banner.remove();
      loadGA();
      loadClarity();
    });
    document.getElementById('consent-reject').addEventListener('click', function(){
      localStorage.setItem('analytics-consent','denied');
      banner.remove();
    });
  }
})();
