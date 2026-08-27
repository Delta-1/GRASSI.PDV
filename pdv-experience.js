(() => {
  const adminMode = document.body.dataset.mode === 'admin';
  const layer = document.getElementById('layer');
  const app = document.getElementById('app');
  const clientSearchKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const clientIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>';
  const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.4-4.4"/></svg>';

  const clientStyles = document.createElement('style');
  clientStyles.textContent = `
    .pos-client-strip{min-height:66px;margin:10px 32px 12px;padding:9px 10px 9px 13px;border:1px solid var(--line);border-radius:15px;background:var(--surface-2);display:flex;align-items:center;gap:9px}.pos-client-strip.selected{border-color:color-mix(in srgb,var(--accent) 40%,var(--line));background:color-mix(in srgb,var(--accent-soft) 65%,var(--surface))}.pos-client-strip-icon{width:39px;height:39px;border-radius:12px;background:var(--surface);color:var(--accent);display:grid;place-items:center;flex:none;box-shadow:0 4px 12px rgba(24,39,75,.06)}.pos-client-strip-icon svg{width:18px;fill:none;stroke:currentColor;stroke-width:2}.pos-client-strip-copy{min-width:140px;flex:1}.pos-client-strip-copy>*{display:block}.pos-client-strip-copy small{font-size:7px;letter-spacing:.08em;color:var(--muted);font-weight:800}.pos-client-strip-copy strong{margin:2px 0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pos-client-strip-copy span{font-size:8px;color:var(--muted)}.pos-client-strip button{height:38px;min-width:auto;padding:0 12px;white-space:nowrap}.pos-client-strip button[data-pdv-client-new]{font-size:9px}
    .pos-client-picker-head>b{height:29px;padding:0 10px;border-radius:9px;background:var(--surface);color:var(--muted);font-size:9px;display:flex;align-items:center;white-space:nowrap}.pos-client-search-field{position:sticky;top:0;z-index:2;padding:4px 0 10px;background:var(--surface)}.pos-client-search-box{height:48px;border:2px solid color-mix(in srgb,var(--accent) 55%,var(--line));border-radius:13px;background:var(--surface);display:flex;align-items:center;gap:9px;padding:0 13px;box-shadow:0 5px 18px rgba(24,39,75,.06)}.pos-client-search-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}.pos-client-search-box svg{width:18px;fill:none;stroke:var(--accent);stroke-width:2}.pos-client-search-box input{height:42px!important;padding:0!important;border:0!important;box-shadow:none!important;font-size:12px!important;flex:1}.pos-consumer-final{width:100%;min-height:60px;margin:0 0 10px;padding:9px 12px;border:1px solid var(--line);border-radius:13px;background:var(--surface);display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer}.pos-consumer-final:hover,.pos-consumer-final.selected{border-color:var(--accent);background:var(--accent-soft)}.pos-consumer-final>span{width:35px;height:35px;border-radius:10px;background:var(--surface-2);color:var(--accent);display:grid;place-items:center}.pos-consumer-final svg{width:16px;fill:none;stroke:currentColor;stroke-width:2}.pos-consumer-final>div{min-width:0;flex:1}.pos-consumer-final strong,.pos-consumer-final small{display:block}.pos-consumer-final strong{font-size:11px}.pos-consumer-final small{margin-top:3px;color:var(--muted);font-size:8px}.pos-consumer-final>b{color:var(--accent);font-size:9px}.pos-client-results{max-height:48vh;overflow:auto;border:1px solid var(--line);border-radius:13px}.pos-client-table tr.selected td{background:var(--accent-soft)}
    @media(max-width:900px){.pos-client-strip{margin-inline:16px}.pos-client-strip button[data-pdv-client-clear]{display:none}}
    @media(max-width:720px){.pos-client-strip{min-height:62px;margin:7px 9px;padding:7px 8px;border-radius:14px;gap:7px}.pos-client-strip-icon{width:36px;height:36px}.pos-client-strip-copy{min-width:0}.pos-client-strip-copy span{display:none}.pos-client-strip button{height:36px;padding:0 9px;font-size:8px}.pos-client-strip button[data-pdv-client-new]{width:36px;padding:0;font-size:0}.pos-client-strip button[data-pdv-client-new]::after{content:'+';font-size:18px}.pos-catalog,.pos-cart-panel{height:calc(100dvh - 408px)}.pos-client-results{max-height:43vh}}
    @media(max-width:420px){.pos-client-strip-copy small{font-size:6px}.pos-client-strip-copy strong{font-size:10px}.pos-consumer-final small{display:none}}
  `;
  document.head.append(clientStyles);

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

  function currentClientName() {
    const label = document.querySelector('.pdv [data-pos-widget="client"] [data-pos-widget-label]')?.textContent?.trim();
    return label && label !== 'Cliente' ? label : '';
  }

  function ensureClientStrip() {
    const pdv = document.querySelector('.pdv');
    const search = pdv?.querySelector('.pdv-search');
    if (!pdv || !search || pdv.querySelector('.pos-client-strip')) return;
    const name = currentClientName();
    const strip = document.createElement('section');
    strip.className = `pos-client-strip${name ? ' selected' : ''}`;
    strip.setAttribute('aria-label', 'Cliente de la venta');
    strip.innerHTML = `<span class="pos-client-strip-icon">${clientIcon}</span><div class="pos-client-strip-copy"><small>CLIENTE DE LA VENTA</small><strong>${name || 'Consumidor final'}</strong><span>${name ? 'Cliente seleccionado' : 'Busque o registre un cliente sin salir del PDV'}</span></div>${name ? '<button class="btn small" type="button" data-pdv-client-clear>Consumidor final</button>' : ''}<button class="btn secondary" type="button" data-pdv-client-search>${name ? 'Cambiar' : 'Buscar cliente'}</button><button class="btn primary" type="button" data-pdv-client-new>Nuevo cliente</button>`;
    search.insertAdjacentElement('afterend', strip);
  }

  function filterClientRows(value = '') {
    const term = clientSearchKey(value);
    const rows = [...document.querySelectorAll('[data-pos-client-row]')];
    let visible = 0;
    rows.forEach(row => {
      const show = !term || clientSearchKey(row.dataset.search).includes(term);
      row.hidden = !show;
      if (show) visible += 1;
    });
    const empty = document.getElementById('posClientSearchEmpty');
    if (empty) empty.hidden = visible > 0 || rows.length === 0;
    const count = document.getElementById('posClientCount');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'cliente' : 'clientes'}`;
  }

  function enhanceClientPicker() {
    const head = document.querySelector('.pos-client-picker-head:not([data-pdv-enhanced])');
    if (!head) return;
    head.dataset.pdvEnhanced = 'true';
    const selectedName = currentClientName();
    const helper = head.querySelector('small');
    if (helper) helper.textContent = 'Busque, seleccione o registre un cliente. El carrito permanecerá abierto.';
    const count = document.createElement('b');
    count.id = 'posClientCount';
    head.querySelector('.btn')?.before(count);
    const input = document.getElementById('posClientSearch');
    const field = input?.closest('.field');
    if (input && field) {
      field.classList.add('pos-client-search-field');
      input.placeholder = 'Nombre, código, CI/NIT o celular';
      input.autocomplete = 'off';
      const box = document.createElement('div');
      box.className = 'pos-client-search-box';
      box.innerHTML = searchIcon;
      input.before(box);
      box.append(input);
    }
    const region = head.parentElement?.querySelector('.data-region');
    if (region) {
      region.classList.add('pos-client-results');
      const consumer = document.createElement('button');
      consumer.type = 'button';
      consumer.className = `pos-consumer-final${selectedName ? '' : ' selected'}`;
      consumer.dataset.selectClient = '';
      consumer.innerHTML = `<span>${clientIcon}</span><div><strong>Consumidor final</strong><small>Venta rápida sin vincular a una cuenta</small></div><b>${selectedName ? 'Usar' : 'Seleccionado'}</b>`;
      region.before(consumer);
    }
    document.querySelectorAll('[data-pos-client-row]').forEach(row => {
      const name = row.querySelector('td strong')?.textContent?.trim();
      if (selectedName && name === selectedName) row.classList.add('selected');
    });
    filterClientRows(input?.value);
    input?.focus();
  }

  function syncClientFlow() {
    ensureClientStrip();
    enhanceClientPicker();
  }

  document.addEventListener('click', event => {
    const clear = event.target.closest?.('[data-pdv-client-clear]');
    const search = event.target.closest?.('[data-pdv-client-search]');
    const create = event.target.closest?.('[data-pdv-client-new]');
    if (!clear && !search && !create) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (clear) window.finishClientSelection?.('');
    if (search) window.posClientPicker?.();
    if (create) window.posClientForm?.();
  }, true);

  document.addEventListener('input', event => {
    if (event.target?.id === 'posClientSearch') filterClientRows(event.target.value);
  }, true);

  if (layer) new MutationObserver(() => { syncPdvPanel(); syncClientFlow(); }).observe(layer, {attributes: true, childList: true, subtree: true, attributeFilter: ['hidden']});
  if (app) new MutationObserver(() => { syncCollapsedWidgets(); syncClientFlow(); }).observe(app, {childList: true, subtree: true});
  syncPdvPanel();
  syncCollapsedWidgets();
  syncClientFlow();
})();
