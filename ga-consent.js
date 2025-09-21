(function () {
  const GOATCOUNTER_COUNT_URL = 'https://democraticjustice.goatcounter.com/count';
  const GOATCOUNTER_SCRIPT_SRC = 'https://gc.zgo.at/count.js';

  function loadGoatCounter() {
    if (document.querySelector('script[data-goatcounter]')) {
      return;
    }

    const goatcounterScript = document.createElement('script');
    goatcounterScript.async = true;
    goatcounterScript.src = GOATCOUNTER_SCRIPT_SRC;
    goatcounterScript.setAttribute('data-goatcounter', GOATCOUNTER_COUNT_URL);

    (document.body || document.head || document.documentElement).appendChild(goatcounterScript);
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

  function init() {
    loadGoatCounter();
    loadClarity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
