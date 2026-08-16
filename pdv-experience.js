(() => {
  const adminMode = document.body.dataset.mode === 'admin';
  const layer = document.getElementById('layer');
  const app = document.getElementById('app');

  function openDedicatedPdv() {
    sessionStorage.setItem('grassi.pos.unlocked', '1');
    const url = new URL('./pdv.html?source=dedicated-window', window.location.href);
    const pdvWindow = window.open(url.href, 'grassi-pdv', 'popup=yes,width=1440,height=900,resizable=yes,scrollbars=yes');
    pdvWindow?.focus();
  }

  document.addEventListener('click', event => {
    const pdvLink = event.target.closest?.('a[href*="pdv.html"]');
    if (pdvLink) sessionStorage.setItem('grassi.pos.unlocked', '1');

    const action = event.target.closest?.('[data-action]')?.dataset.action;
    if (!adminMode || action !== 'open-pos') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDedicatedPdv();
  }, true);

  document.addEventListener('keydown', event => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName);
    if (!adminMode || typing || event.key !== 'F3') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDedicatedPdv();
  }, true);

  function syncPdvPanel() {
    if (!layer) return;
    const isPdvPanel = document.body.dataset.mode === 'standalone-pos' && !layer.hidden && Boolean(
      layer.querySelector('#posClientForm, #posNotesForm, #posDeliveryForm, .pos-client-picker-head')
    );
    layer.classList.toggle('pdv-context-layer', isPdvPanel);
  }

  function syncCollapsedWidgets() {
    document.querySelectorAll('.pdv-sidebar [data-pos-widget]').forEach(button => {
      const label = button.querySelector('[data-pos-widget-label]')?.textContent?.trim();
      if (label) button.title = label;
    });
  }

  if (layer) new MutationObserver(syncPdvPanel).observe(layer, {attributes: true, childList: true, subtree: true, attributeFilter: ['hidden']});
  if (app) new MutationObserver(syncCollapsedWidgets).observe(app, {childList: true, subtree: true});
  syncPdvPanel();
  syncCollapsedWidgets();
})();
