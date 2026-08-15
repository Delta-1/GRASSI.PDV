const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  cart: '<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.5 11h11l2-8H6"/>',
  box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5Z"/><path d="M12 13v8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  badge: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h3M7 16h10"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.09v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  wallet: '<rect x="2" y="5" width="20" height="15" rx="2"/><path d="M16 13h6M2 9h16"/>',
  arrowUp: '<path d="m18 15-6-6-6 6"/>',
  arrowDown: '<path d="m6 9 6 6 6-6"/>',
  alert: '<path d="M10.3 2.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  cash: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9h.01M18 15h.01"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3"/>',
  transfer: '<path d="m17 3 4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  receipt: '<path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2Z"/><path d="M8 9h8M8 13h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  userPlus: '<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
  refresh: '<path d="M20 6v6h-6M4 18v-6h6"/><path d="M6.5 8a7 7 0 0 1 11.8-2L20 8M4 16l1.7 2a7 7 0 0 0 11.8-2"/>'
};

const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.box}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
const todayISO = () => new Date().toISOString();
const dateLabel = value => new Intl.DateTimeFormat('es-BO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(value));

const defaultState = {
  settings: { businessName: 'GRASSI', legalName: 'Grassi Distribuidora', nit: '1029384756', phone: '+591 700 00000', city: 'Cobija, Pando', currency: 'Bs', accent: '#16804b', language: 'es', wholesale: true },
  products: [
    { id:'P001', code:'7501001', name:'Aceite vegetal 900 ml', category:'Alimentos', stock:48, minStock:12, cost:10.5, price:14, wholesale:12.5, unit:'Unidad' },
    { id:'P002', code:'7501002', name:'Arroz superior 5 kg', category:'Alimentos', stock:31, minStock:8, cost:39, price:49, wholesale:45, unit:'Bolsa' },
    { id:'P003', code:'7501003', name:'Azúcar refinada 1 kg', category:'Alimentos', stock:76, minStock:15, cost:6.2, price:8.5, wholesale:7.5, unit:'Paquete' },
    { id:'P004', code:'7501004', name:'Gaseosa cola 2 L', category:'Bebidas', stock:22, minStock:10, cost:9, price:13, wholesale:11.5, unit:'Botella' },
    { id:'P005', code:'7501005', name:'Agua mineral 600 ml', category:'Bebidas', stock:120, minStock:24, cost:2.2, price:4, wholesale:3.2, unit:'Botella' },
    { id:'P006', code:'7501006', name:'Detergente líquido 1 L', category:'Limpieza', stock:7, minStock:10, cost:14, price:20, wholesale:18, unit:'Unidad' },
    { id:'P007', code:'7501007', name:'Papel higiénico x 12', category:'Higiene', stock:18, minStock:8, cost:25, price:34, wholesale:30, unit:'Paquete' },
    { id:'P008', code:'7501008', name:'Leche entera 1 L', category:'Lácteos', stock:42, minStock:12, cost:7.5, price:10, wholesale:9, unit:'Caja' },
    { id:'P009', code:'7501009', name:'Atún en lata 170 g', category:'Alimentos', stock:0, minStock:8, cost:10, price:15, wholesale:13.5, unit:'Lata' },
    { id:'P010', code:'7501010', name:'Galletas surtidas 400 g', category:'Alimentos', stock:56, minStock:12, cost:8, price:12, wholesale:10.5, unit:'Paquete' }
  ],
  clients: [
    { id:'C001', name:'Mercado San José', type:'Mayorista', phone:'729 18456', document:'NIT 5541201', balance:-1260, purchases:18, total:8450, photo:'', ledger:[{date:'2026-08-12T15:30:00', type:'debit', description:'Venta #1041', amount:1460},{date:'2026-08-13T12:00:00', type:'credit', description:'Pago parcial — QR', amount:200}] },
    { id:'C002', name:'Ana María Vargas', type:'Minorista', phone:'721 94750', document:'CI 5987211', balance:320, purchases:7, total:1240, photo:'', ledger:[{date:'2026-08-11T10:30:00', type:'credit', description:'Crédito a favor', amount:320}] },
    { id:'C003', name:'Comercial El Norte', type:'Mayorista', phone:'728 60031', document:'NIT 6875142', balance:-845, purchases:24, total:12860, photo:'', ledger:[{date:'2026-08-14T09:20:00', type:'debit', description:'Venta #1048', amount:845}] },
    { id:'C004', name:'Carlos Rojas', type:'Minorista', phone:'729 23311', document:'CI 8271002', balance:0, purchases:5, total:680, photo:'', ledger:[] },
    { id:'C005', name:'Distribuidora Pando', type:'Mayorista', phone:'711 42008', document:'NIT 9012804', balance:550, purchases:31, total:22640, photo:'', ledger:[{date:'2026-08-10T16:40:00', type:'credit', description:'Pago anticipado', amount:550}] },
    { id:'C006', name:'Lucía Fernández', type:'Minorista', phone:'755 81023', document:'CI 7391804', balance:-120, purchases:3, total:395, photo:'', ledger:[{date:'2026-08-09T18:00:00', type:'debit', description:'Venta #1028', amount:120}] }
  ],
  employees: [
    { id:'F001', name:'Camila Flores', role:'Cajera', phone:'729 55210', document:'CI 6721800', sales:46, total:8920, ticket:193.91, hours:38.5, goal:82, photo:'' },
    { id:'F002', name:'Mateo Roca', role:'Vendedor mayorista', phone:'721 31800', document:'CI 7712905', sales:32, total:12680, ticket:396.25, hours:36, goal:93, photo:'' },
    { id:'F003', name:'Sofía Suárez', role:'Caja y stock', phone:'728 00194', document:'CI 6814027', sales:29, total:6745, ticket:232.59, hours:34, goal:68, photo:'' },
    { id:'F004', name:'Diego Vaca', role:'Almacén', phone:'755 09013', document:'CI 6285300', sales:8, total:1980, ticket:247.5, hours:40, goal:55, photo:'' }
  ],
  sales: [
    { id:'V1052', date:'2026-08-15T13:42:00', client:'Mercado San José', employee:'Camila Flores', total:684, payment:'QR' },
    { id:'V1051', date:'2026-08-15T12:26:00', client:'Consumidor final', employee:'Camila Flores', total:128.5, payment:'Efectivo' },
    { id:'V1050', date:'2026-08-15T11:11:00', client:'Comercial El Norte', employee:'Mateo Roca', total:945, payment:'Transferencia' },
    { id:'V1049', date:'2026-08-15T09:48:00', client:'Ana María Vargas', employee:'Sofía Suárez', total:76, payment:'PIX' },
    { id:'V1048', date:'2026-08-14T17:20:00', client:'Comercial El Norte', employee:'Mateo Roca', total:845, payment:'Cuenta cliente' }
  ],
  cash: [
    { id:'M001', date:'2026-08-15T13:42:00', type:'in', description:'Venta #V1052 — QR', amount:684 },
    { id:'M002', date:'2026-08-15T12:26:00', type:'in', description:'Venta #V1051 — Efectivo', amount:128.5 },
    { id:'M003', date:'2026-08-15T11:11:00', type:'in', description:'Venta #V1050 — Transferencia', amount:945 },
    { id:'M004', date:'2026-08-15T10:05:00', type:'out', description:'Compra de bolsas y embalajes', amount:185 },
    { id:'M005', date:'2026-08-15T09:48:00', type:'in', description:'Venta #V1049 — PIX', amount:76 }
  ],
  closings: []
};

const storageKey = 'grassi.pdv.v1';
const loadState = () => {
  try { return { ...structuredClone(defaultState), ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
  catch { return structuredClone(defaultState); }
};
let state = loadState();
let ui = { view:'dashboard', search:'', category:'Todos', cart:[], clientId:'', wholesale:false, settingsTab:'general', productFilter:'all', importType:'backup' };

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  applyBrand();
}

function applyBrand() {
  document.documentElement.style.setProperty('--brand', state.settings.accent || '#16804b');
  document.documentElement.style.setProperty('--brand-dark', shadeColor(state.settings.accent || '#16804b', -24));
  document.documentElement.style.setProperty('--brand-soft', shadeColor(state.settings.accent || '#16804b', 88));
  $('#brandName').textContent = state.settings.businessName || 'GRASSI';
  $('#brandMark').textContent = (state.settings.businessName || 'G').charAt(0).toUpperCase();
  document.title = `${state.settings.businessName || 'GRASSI'} PDV`;
}

function shadeColor(hex, percent) {
  const n = parseInt(hex.replace('#',''), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = n >> 16, G = (n >> 8) & 255, B = n & 255;
  return `#${(0x1000000 + (Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B)).toString(16).slice(1)}`;
}

const money = value => `${state.settings.currency || 'Bs'} ${Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
const initials = name => name.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase();
const avatarStyle = photo => photo ? `style="background-image:url('${esc(photo)}');color:transparent"` : '';
const todaySales = () => state.sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
const monthSales = () => state.sales.filter(s => { const d = new Date(s.date), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); });
const sum = (items, key = 'amount') => items.reduce((total, item) => total + Number(item[key] || 0), 0);

function setView(view) {
  ui.view = view;
  ui.search = '';
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  const titles = {
    dashboard:['Resumen general','Buenos días, Victor'], pos:['Venta rápida','Punto de venta'], products:['Inventario y precios','Productos'],
    clients:['Cuentas y movimientos','Clientes'], employees:['Equipo y desempeño','Funcionarios'], finance:['Entradas, salidas y cierres','Finanzas'], settings:['Personalización y datos','Configuración']
  };
  $('#pageEyebrow').textContent = titles[view][0];
  $('#pageTitle').textContent = titles[view][1];
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.remove('show');
  render();
  $('#app').focus({ preventScroll:true });
}

function render() {
  const views = { dashboard:renderDashboard, pos:renderPos, products:renderProducts, clients:renderClients, employees:renderEmployees, finance:renderFinance, settings:renderSettings };
  $('#app').innerHTML = views[ui.view]();
  injectIcons($('#app'));
}

function renderDashboard() {
  const daily = sum(todaySales(), 'total');
  const low = state.products.filter(p => p.stock <= p.minStock).length;
  const debt = Math.abs(sum(state.clients.filter(c => c.balance < 0), 'balance'));
  const bars = [42,64,51,78,59,86,72];
  return `<section class="view">
    <div class="stats-grid">
      ${statCard('wallet','green','Ventas de hoy',money(daily),'12,4%','vs. ayer')}
      ${statCard('receipt','blue','Ventas realizadas',todaySales().length,'8,1%','operaciones de hoy')}
      ${statCard('alert','orange','Stock bajo',low,'','productos requieren atención')}
      ${statCard('arrowDown','red','Cuentas por cobrar',money(debt),'3,2%','saldo pendiente de clientes',true)}
    </div>
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-head"><div><h3>Rendimiento de ventas</h3><p>Comparativo de los últimos 7 días</p></div><span class="badge">+12,4% esta semana</span></div>
        <div class="card-body"><div class="chart-wrap"><div class="chart-y"><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><div class="chart-bars">${bars.map((h,i)=>`<div class="chart-col"><div class="chart-bar" style="height:${h}%"></div><span>${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i]}</span></div>`).join('')}</div></div></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Actividad reciente</h3><p>Últimos movimientos del sistema</p></div><button class="ghost-btn small" data-view-link="finance">Ver todo</button></div>
        <div class="card-body activity-list">${state.cash.slice(0,4).map(m=>`<div class="activity-item"><div class="activity-icon">${svg(m.type==='in'?'arrowUp':'arrowDown')}</div><div><strong>${esc(m.description)}</strong><p>${dateLabel(m.date)}</p></div><strong style="color:${m.type==='in'?'var(--brand)':'var(--danger)'}">${m.type==='in'?'+':'−'} ${money(m.amount)}</strong></div>`).join('')}</div>
      </div>
    </div>
    <div class="quick-actions">
      ${quickAction('cart','Nueva venta','Abrir punto de venta','pos')}
      ${quickAction('box','Nuevo producto','Registro rápido','product-add')}
      ${quickAction('userPlus','Nuevo cliente','Crear una cuenta','client-add')}
      ${quickAction('download','Exportar datos','Respaldo del sistema','settings')}
    </div>
  </section>`;
}

function statCard(icon, color, label, value, trend, note, down = false) {
  return `<article class="stat-card"><div class="stat-top"><span class="stat-icon ${color}">${svg(icon)}</span>${trend?`<span class="trend ${down?'down':''}">${down?'−':'+'}${trend}</span>`:''}</div><small>${label}</small><h3>${value}</h3><p>${note}</p></article>`;
}

function quickAction(icon, title, note, action) {
  const attr = ['pos','settings'].includes(action) ? `data-go="${action}"` : `data-action="${action}"`;
  return `<button class="quick-action" ${attr}><span>${svg(icon)}</span><span><strong>${title}</strong><small>${note}</small></span></button>`;
}

function renderPos() {
  const categories = ['Todos', ...new Set(state.products.map(p => p.category))];
  const products = state.products.filter(p => (ui.category === 'Todos' || p.category === ui.category) && `${p.name} ${p.code}`.toLowerCase().includes(ui.search.toLowerCase()));
  const subtotal = ui.cart.reduce((total, item) => total + item.qty * item.price, 0);
  return `<section class="view pos-layout">
    <div class="catalog-panel">
      <div class="view-head"><div><h2>Venta rápida</h2><p>Busque por nombre, código o use un lector de código de barras</p></div><div class="view-actions"><button class="secondary-btn compact ${ui.wholesale?'active':''}" data-action="toggle-wholesale">${svg('box')} ${ui.wholesale?'Mayorista activo':'Modo mayorista'}</button></div></div>
      <div class="search-box"><span>${svg('search')}</span><input id="posSearch" value="${esc(ui.search)}" placeholder="Buscar producto o escanear código..." autocomplete="off" /></div>
      <div class="category-tabs">${categories.map(c=>`<button class="category-tab ${ui.category===c?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="product-grid">${products.map(p=>`<button class="product-tile" data-add-cart="${p.id}" ${p.stock<=0?'disabled':''}><span class="stock-pill">${p.stock} disp.</span><span class="tile-icon">${esc(p.name.charAt(0))}</span><strong>${esc(p.name)}</strong><small>${esc(p.code)} · ${esc(p.unit)}</small><span class="price">${money(ui.wholesale?p.wholesale:p.price)}</span></button>`).join('') || `<div class="empty">${svg('search')}<div>No se encontraron productos</div></div>`}</div>
    </div>
    <aside class="sale-panel">
      <div class="sale-head"><div class="sale-head-row"><h3>Venta actual</h3><span class="sale-number">#${String(1053 + state.sales.length - 5).padStart(4,'0')}</span></div><select class="client-select" id="saleClient"><option value="">Consumidor final</option>${state.clients.map(c=>`<option value="${c.id}" ${ui.clientId===c.id?'selected':''}>${esc(c.name)} · ${c.type}</option>`).join('')}</select></div>
      <div class="cart-list">${ui.cart.length ? ui.cart.map(item=>`<div class="cart-item"><div><strong>${esc(item.name)}</strong><small>${money(item.price)} / ${esc(item.unit)}</small><div class="qty-control"><button data-cart-qty="${item.id}" data-delta="-1">−</button><span>${item.qty}</span><button data-cart-qty="${item.id}" data-delta="1">+</button></div></div><div class="cart-price">${money(item.price*item.qty)}<div class="row-actions"><button data-cart-remove="${item.id}" aria-label="Quitar">${svg('trash')}</button></div></div></div>`).join('') : `<div class="cart-empty"><span>${svg('cart')}</span>Agregue productos para iniciar la venta</div>`}</div>
      <div class="sale-totals"><div class="total-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="total-line"><span>Descuento</span><strong>${money(0)}</strong></div><div class="total-line grand"><span>Total</span><strong>${money(subtotal)}</strong></div></div>
      <div class="sale-actions"><button class="primary-btn" data-action="open-payment" ${!ui.cart.length?'disabled':''}>${svg('cash')} Cobrar ${money(subtotal)}</button><button class="ghost-btn small" data-action="clear-cart" ${!ui.cart.length?'disabled':''}>Cancelar venta</button></div>
    </aside>
  </section>`;
}

function renderProducts() {
  const filtered = state.products.filter(p => `${p.name} ${p.code} ${p.category}`.toLowerCase().includes(ui.search.toLowerCase()) && (ui.productFilter==='all' || ui.productFilter==='low' && p.stock<=p.minStock || ui.productFilter==='zero' && p.stock===0));
  return `<section class="view"><div class="view-head"><div><h2>Productos</h2><p>${state.products.length} productos registrados · precios minorista y mayorista</p></div><div class="view-actions"><button class="secondary-btn compact" data-action="export-products">${svg('download')} CSV</button><button class="primary-btn compact" data-action="product-add">${svg('plus')} Nuevo producto</button></div></div>
    <div class="toolbar"><div class="search-box"><span>${svg('search')}</span><input id="globalSearch" placeholder="Buscar por nombre, código o categoría..." value="${esc(ui.search)}" /></div><select class="filter-select" id="stockFilter"><option value="all" ${ui.productFilter==='all'?'selected':''}>Todo el inventario</option><option value="low" ${ui.productFilter==='low'?'selected':''}>Stock bajo</option><option value="zero" ${ui.productFilter==='zero'?'selected':''}>Sin stock</option></select></div>
    <div class="table-card"><table class="data-table"><thead><tr><th>Producto</th><th>Código</th><th>Categoría</th><th>Stock</th><th>Precio</th><th>Mayorista</th><th></th></tr></thead><tbody>${filtered.map(p=>`<tr><td><div class="product-cell"><span class="product-thumb">${esc(p.name.charAt(0))}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.unit)}</small></div></div></td><td>${esc(p.code)}</td><td><span class="badge blue">${esc(p.category)}</span></td><td><span class="badge ${p.stock===0?'danger':p.stock<=p.minStock?'warning':''}">${p.stock===0?'Sin stock':p.stock<=p.minStock?`${p.stock} · Bajo`:`${p.stock} disp.`}</span></td><td><strong>${money(p.price)}</strong></td><td>${money(p.wholesale)}</td><td><div class="row-actions"><button data-edit-product="${p.id}" title="Editar">${svg('edit')}</button><button data-delete-product="${p.id}" title="Eliminar">${svg('trash')}</button></div></td></tr>`).join('')}</tbody></table>${!filtered.length?`<div class="empty">${svg('box')}<div>No hay productos para mostrar</div></div>`:''}</div>
  </section>`;
}

function renderClients() {
  const filtered = state.clients.filter(c => `${c.name} ${c.document} ${c.phone}`.toLowerCase().includes(ui.search.toLowerCase()));
  return `<section class="view"><div class="view-head"><div><h2>Clientes</h2><p>Perfiles, compras, créditos y débitos en una sola cuenta</p></div><div class="view-actions"><button class="secondary-btn compact" data-action="export-clients">${svg('download')} CSV</button><button class="primary-btn compact" data-action="client-add">${svg('userPlus')} Nuevo cliente</button></div></div>
    <div class="toolbar"><div class="search-box"><span>${svg('search')}</span><input id="globalSearch" placeholder="Buscar cliente, CI/NIT o teléfono..." value="${esc(ui.search)}" /></div><select class="filter-select"><option>Todos los clientes</option><option>Con deuda</option><option>Con crédito</option><option>Mayoristas</option></select></div>
    <div class="profile-grid">${filtered.map(c=>`<article class="profile-card" data-client-profile="${c.id}"><div class="profile-main"><div class="avatar avatar-lg" ${avatarStyle(c.photo)}>${initials(c.name)}</div><div><strong>${esc(c.name)}</strong><p>${esc(c.type)} · ${esc(c.document)}</p><p>${esc(c.phone)}</p></div><div class="profile-balance ${c.balance<0?'negative':''}"><span>${c.balance<0?'Debe':'Saldo'}</span><strong>${money(Math.abs(c.balance))}</strong></div></div><div class="profile-meta"><div><strong>${c.purchases}</strong><span>Compras</span></div><div><strong>${money(c.total)}</strong><span>Total comprado</span></div><div><strong>${c.ledger.length}</strong><span>Movimientos</span></div></div></article>`).join('')}</div>
  </section>`;
}

function renderEmployees() {
  const filtered = state.employees.filter(e => `${e.name} ${e.role} ${e.document}`.toLowerCase().includes(ui.search.toLowerCase()));
  return `<section class="view"><div class="view-head"><div><h2>Funcionarios</h2><p>Desempeño individual, ventas y productividad del equipo</p></div><div class="view-actions"><button class="secondary-btn compact" data-action="export-employees">${svg('download')} CSV</button><button class="primary-btn compact" data-action="employee-add">${svg('userPlus')} Nuevo funcionario</button></div></div>
    <div class="toolbar"><div class="search-box"><span>${svg('search')}</span><input id="globalSearch" placeholder="Buscar funcionario, cargo o CI..." value="${esc(ui.search)}" /></div></div>
    <div class="profile-grid">${filtered.map(e=>`<article class="profile-card" data-employee-profile="${e.id}"><div class="profile-main"><div class="avatar avatar-lg avatar-green" ${avatarStyle(e.photo)}>${initials(e.name)}</div><div><strong>${esc(e.name)}</strong><p>${esc(e.role)}</p><p>${esc(e.phone)}</p></div><div class="profile-balance"><span>Meta</span><strong>${e.goal}%</strong></div></div><div class="profile-meta"><div><strong>${e.sales}</strong><span>Ventas</span></div><div><strong>${money(e.total)}</strong><span>Facturado</span></div><div><strong>${money(e.ticket)}</strong><span>Ticket medio</span></div></div></article>`).join('')}</div>
  </section>`;
}

function renderFinance() {
  const incoming = sum(state.cash.filter(m=>m.type==='in'));
  const outgoing = sum(state.cash.filter(m=>m.type==='out'));
  const month = sum(monthSales(), 'total');
  return `<section class="view"><div class="view-head"><div><h2>Finanzas</h2><p>Flujo financiero, movimientos y cierre de caja</p></div><div class="view-actions"><button class="secondary-btn compact" data-action="print-report">${svg('file')} Informe</button><button class="primary-btn compact" data-action="cash-movement">${svg('plus')} Movimiento</button></div></div>
    <div class="stats-grid">${statCard('arrowUp','green','Entradas',money(incoming),'','período actual')}${statCard('arrowDown','red','Salidas',money(outgoing),'','período actual')}${statCard('wallet','blue','Saldo',money(incoming-outgoing),'','caja calculada')}${statCard('calendar','orange','Ventas del mes',money(month),'','acumulado mensual')}</div>
    <div class="finance-layout"><div class="card"><div class="card-head"><div><h3>Movimientos recientes</h3><p>Entradas e salidas registradas</p></div><select class="filter-select"><option>Hoy</option><option>Este mes</option></select></div><div class="movement-list">${state.cash.map(m=>`<div class="movement ${m.type==='out'?'out':''}"><div class="movement-type">${svg(m.type==='in'?'arrowUp':'arrowDown')}</div><div><strong>${esc(m.description)}</strong><p>${dateLabel(m.date)}</p></div><b>${m.type==='in'?'+':'−'} ${money(m.amount)}</b></div>`).join('')}</div></div>
    <aside><div class="close-card"><h3>Cierre de caja</h3><p>Resumen de la caja actual</p><div class="close-row"><span>Saldo inicial</span><strong>${money(500)}</strong></div><div class="close-row"><span>Entradas</span><strong>${money(incoming)}</strong></div><div class="close-row"><span>Salidas</span><strong>${money(outgoing)}</strong></div><div class="close-row"><span>Saldo esperado</span><strong>${money(500+incoming-outgoing)}</strong></div><button class="primary-btn" data-action="close-register">Cerrar caja del día</button></div></aside></div>
  </section>`;
}

function renderSettings() {
  return `<section class="view"><div class="view-head"><div><h2>Configuración</h2><p>Identidad del sistema, preferencias y migración de datos</p></div></div><div class="settings-layout">
    <nav class="settings-menu"><button class="${ui.settingsTab==='general'?'active':''}" data-settings-tab="general">Empresa y marca</button><button class="${ui.settingsTab==='migration'?'active':''}" data-settings-tab="migration">Importar / Exportar</button><button class="${ui.settingsTab==='system'?'active':''}" data-settings-tab="system">Sistema</button></nav>
    ${ui.settingsTab === 'general' ? settingsGeneral() : ui.settingsTab === 'migration' ? settingsMigration() : settingsSystem()}
  </div></section>`;
}

function settingsGeneral() {
  const s = state.settings;
  return `<form class="settings-content form-grid" id="brandForm"><div class="field full"><h3>Empresa y marca</h3><p>Personalice el sistema para cada comercio. Los cambios se aplican en toda la interfaz.</p></div><div class="field"><label>Nombre comercial</label><input name="businessName" value="${esc(s.businessName)}" required /></div><div class="field"><label>Razón social</label><input name="legalName" value="${esc(s.legalName)}" /></div><div class="field"><label>NIT</label><input name="nit" value="${esc(s.nit)}" /></div><div class="field"><label>Teléfono</label><input name="phone" value="${esc(s.phone)}" /></div><div class="field"><label>Ciudad</label><input name="city" value="${esc(s.city)}" /></div><div class="field"><label>Color principal</label><div class="color-field"><input type="color" name="accent" value="${esc(s.accent)}" /><input value="${esc(s.accent)}" disabled /></div></div><div class="form-footer"><button type="submit" class="primary-btn">Guardar cambios</button></div></form>`;
}

function settingsMigration() {
  return `<div class="settings-content"><h3>Importación y exportación</h3><p>Migre productos, clientes, funcionarios, cuentas y movimientos entre sistemas.</p><div class="migration-grid">
    <article class="migration-card"><span>${svg('download')}</span><h4>Respaldo completo</h4><p>Exporta toda la información del sistema en un archivo JSON restaurable.</p><button class="secondary-btn small" data-action="export-all">Exportar respaldo</button></article>
    <article class="migration-card"><span>${svg('upload')}</span><h4>Restaurar respaldo</h4><p>Importa un archivo JSON generado por GRASSI PDV.</p><button class="secondary-btn small" data-action="import-backup">Seleccionar JSON</button></article>
    <article class="migration-card"><span>${svg('box')}</span><h4>Productos</h4><p>CSV con código, nombre, stock, costo y precios.</p><div class="view-actions"><button class="secondary-btn small" data-action="export-products">Exportar</button><button class="secondary-btn small" data-action="import-products">Importar</button></div></article>
    <article class="migration-card"><span>${svg('users')}</span><h4>Clientes y cuentas</h4><p>Clientes, saldos, créditos, débitos y crediarios.</p><div class="view-actions"><button class="secondary-btn small" data-action="export-clients">Exportar</button><button class="secondary-btn small" data-action="import-clients">Importar</button></div></article>
    <article class="migration-card"><span>${svg('badge')}</span><h4>Funcionarios</h4><p>Perfiles, cargos, ventas y métricas individuales.</p><div class="view-actions"><button class="secondary-btn small" data-action="export-employees">Exportar</button><button class="secondary-btn small" data-action="import-employees">Importar</button></div></article>
    <article class="migration-card"><span>${svg('refresh')}</span><h4>Datos de demostración</h4><p>Restaura los registros de ejemplo para continuar las pruebas.</p><button class="danger-btn small" data-action="reset-demo">Restaurar demo</button></article>
  </div></div>`;
}

function settingsSystem() {
  const s = state.settings;
  return `<form class="settings-content form-grid" id="systemForm"><div class="field full"><h3>Preferencias del sistema</h3><p>Configuración regional y comercial.</p></div><div class="field"><label>Idioma principal</label><select name="language"><option value="es" ${s.language==='es'?'selected':''}>Español (principal)</option><option value="pt" ${s.language==='pt'?'selected':''}>Português</option></select></div><div class="field"><label>Moneda</label><select name="currency"><option value="Bs" selected>Bs — Boliviano</option></select></div><div class="field full"><label><input type="checkbox" name="wholesale" ${s.wholesale?'checked':''} style="width:auto;min-height:auto;margin-right:7px" /> Habilitar precios y ventas por mayor</label><small>Permite alternar rápidamente entre precio minorista y mayorista en el PDV.</small></div><div class="form-footer"><button type="submit" class="primary-btn">Guardar preferencias</button></div></form>`;
}

function injectIcons(scope = document) {
  $$('[data-icon]', scope).forEach(el => { const name = el.dataset.icon; if (icons[name]) el.innerHTML = svg(name); });
}

function openModal(content) {
  $('#modalContent').innerHTML = content;
  injectIcons($('#modalContent'));
  $('#modal').showModal();
}

function closeModal() { if ($('#modal').open) $('#modal').close(); }
const modalHead = (title, subtitle='') => `<div class="modal-head"><div><h3>${title}</h3>${subtitle?`<p>${subtitle}</p>`:''}</div><button class="icon-btn" data-action="close-modal">${svg('x')}</button></div>`;

function productModal(product = null) {
  const p = product || { id:'', code:'', name:'', category:'Alimentos', stock:0, minStock:5, cost:0, price:0, wholesale:0, unit:'Unidad' };
  openModal(`<form id="productForm" data-id="${p.id}">${modalHead(product?'Editar producto':'Nuevo producto','Registro rápido de inventario y precios')}<div class="modal-body"><div class="form-grid"><div class="field full"><label>Nombre del producto</label><input name="name" value="${esc(p.name)}" required autofocus /></div><div class="field"><label>Código / código de barras</label><input name="code" value="${esc(p.code)}" required /></div><div class="field"><label>Categoría</label><input name="category" value="${esc(p.category)}" required /></div><div class="field"><label>Unidad</label><select name="unit">${['Unidad','Paquete','Caja','Bolsa','Botella','Lata','Kg'].map(v=>`<option ${p.unit===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Stock actual</label><input type="number" min="0" name="stock" value="${p.stock}" required /></div><div class="field"><label>Stock mínimo</label><input type="number" min="0" name="minStock" value="${p.minStock}" required /></div><div class="field"><label>Costo (Bs)</label><input type="number" step="0.01" min="0" name="cost" value="${p.cost}" required /></div><div class="field"><label>Precio minorista (Bs)</label><input type="number" step="0.01" min="0" name="price" value="${p.price}" required /></div><div class="field"><label>Precio mayorista (Bs)</label><input type="number" step="0.01" min="0" name="wholesale" value="${p.wholesale}" required /></div></div></div><div class="modal-foot"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button type="submit" class="primary-btn">Guardar producto</button></div></form>`);
}

function personModal(type) {
  const employee = type === 'employee';
  openModal(`<form id="${employee?'employeeForm':'clientForm'}">${modalHead(employee?'Nuevo funcionario':'Nuevo cliente','Cree un perfil completo en pocos segundos')}<div class="modal-body"><div class="form-grid"><div class="field full"><label>Nombre completo / empresa</label><input name="name" required autofocus /></div><div class="field"><label>${employee?'Cargo':'Tipo de cliente'}</label>${employee?'<input name="role" placeholder="Ej.: Cajero, vendedor..." required />':'<select name="type"><option>Minorista</option><option>Mayorista</option></select>'}</div><div class="field"><label>CI / NIT</label><input name="document" /></div><div class="field"><label>Teléfono</label><input name="phone" /></div><div class="field"><label>Foto de perfil</label><input type="file" name="photo" accept="image/*" /></div>${employee?'':'<div class="field"><label>Saldo inicial (Bs)</label><input type="number" step="0.01" name="balance" value="0" /><small>Use negativo para deuda y positivo para crédito.</small></div>'}</div></div><div class="modal-foot"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button type="submit" class="primary-btn">Crear perfil</button></div></form>`);
}

function clientProfile(id) {
  const c = state.clients.find(x=>x.id===id); if (!c) return;
  openModal(`${modalHead('Cuenta del cliente','Historial de adiciones y sustracciones')}<div class="modal-body"><div class="modal-profile"><div class="avatar avatar-lg" ${avatarStyle(c.photo)}>${initials(c.name)}</div><div><h4>${esc(c.name)}</h4><p>${esc(c.type)} · ${esc(c.document)} · ${esc(c.phone)}</p></div></div><div class="balance-hero"><div><span>Saldo actual</span><strong style="color:${c.balance<0?'var(--danger)':'var(--brand-dark)'}">${c.balance<0?'− ':''}${money(Math.abs(c.balance))}</strong></div><span>${c.balance<0?'Cuenta por cobrar':'Crédito disponible'}</span></div><div class="view-actions" style="margin-bottom:14px"><button class="danger-btn small" data-ledger="debit" data-client="${c.id}">${svg('arrowDown')} Añadir débito</button><button class="primary-btn small" data-ledger="credit" data-client="${c.id}">${svg('arrowUp')} Añadir crédito</button></div><div class="ledger">${c.ledger.length?c.ledger.slice().reverse().map(l=>`<div class="ledger-row ${l.type}"><div><strong>${esc(l.description)}</strong><p>${dateLabel(l.date)}</p></div><b>${l.type==='credit'?'+':'−'} ${money(l.amount)}</b></div>`).join(''):'<div class="empty">Sin movimientos</div>'}</div></div><div class="modal-foot"><button class="secondary-btn" data-action="close-modal">Cerrar</button></div>`);
}

function ledgerModal(clientId, type) {
  const c = state.clients.find(x=>x.id===clientId); if (!c) return;
  openModal(`<form id="ledgerForm" data-client="${c.id}" data-type="${type}">${modalHead(type==='credit'?'Registrar crédito':'Registrar débito',esc(c.name))}<div class="modal-body"><div class="form-grid"><div class="field"><label>Valor (Bs)</label><input type="number" name="amount" min="0.01" step="0.01" required autofocus /></div><div class="field"><label>Fecha</label><input type="date" name="date" value="${new Date().toISOString().slice(0,10)}" required /></div><div class="field full"><label>Descripción</label><input name="description" placeholder="Motivo del movimiento" required /></div></div></div><div class="modal-foot"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button type="submit" class="primary-btn">Registrar movimiento</button></div></form>`);
}

function employeeProfile(id) {
  const e = state.employees.find(x=>x.id===id); if (!e) return;
  const employeeSales = state.sales.filter(s=>s.employee===e.name).slice(0,5);
  openModal(`${modalHead('Perfil del funcionario','Métricas individuales y ventas')}<div class="modal-body"><div class="modal-profile"><div class="avatar avatar-lg avatar-green" ${avatarStyle(e.photo)}>${initials(e.name)}</div><div><h4>${esc(e.name)}</h4><p>${esc(e.role)} · ${esc(e.document)} · ${esc(e.phone)}</p></div></div><div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">${statCard('receipt','green','Ventas',e.sales,'','operaciones')}${statCard('wallet','blue','Facturado',money(e.total),'','acumulado')}${statCard('chart','orange','Meta',`${e.goal}%`,'','cumplimiento')}</div><div class="ledger">${employeeSales.map(s=>`<div class="ledger-row"><div><strong>${esc(s.id)} · ${esc(s.client)}</strong><p>${dateLabel(s.date)} · ${esc(s.payment)}</p></div><b>${money(s.total)}</b></div>`).join('') || '<div class="empty">Sin ventas recientes</div>'}</div></div><div class="modal-foot"><button class="secondary-btn" data-action="close-modal">Cerrar</button></div>`);
}

function paymentModal() {
  const total = ui.cart.reduce((n,i)=>n+i.qty*i.price,0);
  openModal(`<form id="paymentForm" data-payment="Efectivo">${modalHead('Finalizar venta','Seleccione la forma de pago')}<div class="modal-body"><div class="payment-grid">${[['Efectivo','cash'],['PIX','card'],['QR','qr'],['Transferencia','transfer']].map(([name,icon],i)=>`<button type="button" class="payment-option ${i===0?'active':''}" data-payment="${name}"><span>${svg(icon)}</span><strong>${name}</strong></button>`).join('')}${ui.clientId?`<button type="button" class="payment-option" data-payment="Cuenta cliente"><span>${svg('users')}</span><strong>Cuenta cliente</strong></button>`:''}</div><div class="receipt-total"><span>Total a cobrar</span><strong>${money(total)}</strong></div><div class="field" id="cashReceived"><label>Valor recibido (Bs)</label><input type="number" name="received" min="${total}" step="0.01" value="${total.toFixed(2)}" /></div></div><div class="modal-foot"><button type="button" class="secondary-btn" data-action="close-modal">Volver</button><button type="submit" class="primary-btn">Confirmar pago</button></div></form>`);
}

function cashMovementModal() {
  openModal(`<form id="cashMovementForm">${modalHead('Nuevo movimiento','Registre una entrada o salida manual')}<div class="modal-body"><div class="form-grid"><div class="field"><label>Tipo</label><select name="type"><option value="in">Entrada</option><option value="out">Salida</option></select></div><div class="field"><label>Valor (Bs)</label><input type="number" min="0.01" step="0.01" name="amount" required /></div><div class="field full"><label>Descripción</label><input name="description" required /></div></div></div><div class="modal-foot"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button type="submit" class="primary-btn">Registrar</button></div></form>`);
}

function toast(message, type='') {
  const el = document.createElement('div'); el.className = `toast ${type}`; el.innerHTML = `${svg(type==='error'?'alert':'check')}<span>${esc(message)}</span>`;
  $('#toastRegion').append(el); setTimeout(()=>el.remove(), 3200);
}

function addCart(id) {
  const p = state.products.find(x=>x.id===id); if (!p || p.stock<=0) return;
  const existing = ui.cart.find(x=>x.id===id);
  if (existing) { if(existing.qty < p.stock) existing.qty++; else toast('No hay más unidades disponibles','error'); }
  else ui.cart.push({ id:p.id, name:p.name, unit:p.unit, qty:1, price:ui.wholesale?p.wholesale:p.price });
  render();
}

function completeSale(payment, received) {
  const total = ui.cart.reduce((n,i)=>n+i.qty*i.price,0);
  const client = state.clients.find(c=>c.id===ui.clientId);
  const employee = state.employees[0];
  ui.cart.forEach(item => { const p=state.products.find(x=>x.id===item.id); if(p) p.stock=Math.max(0,p.stock-item.qty); });
  const id = `V${1053 + state.sales.length - 5}`;
  state.sales.unshift({ id, date:todayISO(), client:client?.name || 'Consumidor final', employee:employee.name, total, payment });
  employee.sales++; employee.total += total; employee.ticket = employee.total / employee.sales;
  if (client) { client.purchases++; client.total+=total; if(payment==='Cuenta cliente'){ client.balance-=total; client.ledger.push({date:todayISO(),type:'debit',description:`Venta #${id}`,amount:total}); } }
  if (payment !== 'Cuenta cliente') state.cash.unshift({ id:`M${Date.now()}`, date:todayISO(), type:'in', description:`Venta #${id} — ${payment}`, amount:total });
  saveState(); ui.cart=[]; ui.clientId=''; closeModal(); render();
  const change = payment==='Efectivo' ? Math.max(0,Number(received||0)-total) : 0;
  openModal(`${modalHead('Venta completada')}<div class="modal-body receipt-success"><div class="success-icon">${svg('check')}</div><h3>¡Pago registrado!</h3><p>Venta ${id} · ${esc(payment)}</p><div class="receipt-total"><span>Total recibido</span><strong>${money(total)}</strong></div>${change?`<p>Cambio: <strong>${money(change)}</strong></p>`:''}</div><div class="modal-foot"><button class="secondary-btn" data-action="close-modal">Cerrar</button><button class="primary-btn" data-action="print-receipt">${svg('receipt')} Imprimir recibo</button></div>`);
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const cell = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
  return [headers.map(cell).join(','), ...rows.map(row=>headers.map(h=>cell(row[h])).join(','))].join('\n');
}

function parseCSV(text) {
  const rows=[]; let row=[], value='', quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i], next=text[i+1];
    if(char==='"' && quoted && next==='"'){ value+='"'; i++; }
    else if(char==='"') quoted=!quoted;
    else if(char===',' && !quoted){ row.push(value); value=''; }
    else if((char==='\n'||char==='\r') && !quoted){ if(char==='\r'&&next==='\n') i++; row.push(value); if(row.some(cell=>cell.trim())) rows.push(row); row=[]; value=''; }
    else value+=char;
  }
  if(value.length||row.length){row.push(value);rows.push(row);}
  if(rows.length<2) return [];
  const headers=rows.shift().map(h=>h.replace(/^\ufeff/,'').trim());
  return rows.map(cells=>Object.fromEntries(headers.map((header,index)=>[header,cells[index]??''])));
}

function download(name, content, type='text/plain') {
  const blob = new Blob([content], {type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}

function exportCSV(type) {
  const rows = type==='products' ? state.products : type==='clients' ? state.clients.map(({ledger,photo,...c})=>({...c,ledger:JSON.stringify(ledger)})) : state.employees.map(({photo,...e})=>e);
  download(`grassi-${type}.csv`, '\ufeff'+toCSV(rows), 'text/csv;charset=utf-8'); toast('Archivo CSV generado');
}

async function fileToDataURL(file) {
  if (!file || !file.size) return '';
  return await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file); });
}

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-view]'); if(nav) return setView(nav.dataset.view);
  const go = event.target.closest('[data-go]'); if(go) return setView(go.dataset.go);
  const viewLink = event.target.closest('[data-view-link]'); if(viewLink) return setView(viewLink.dataset.viewLink);
  const category = event.target.closest('[data-category]'); if(category){ ui.category=category.dataset.category; return render(); }
  const add = event.target.closest('[data-add-cart]'); if(add) return addCart(add.dataset.addCart);
  const qty = event.target.closest('[data-cart-qty]'); if(qty){ const item=ui.cart.find(x=>x.id===qty.dataset.cartQty); if(item){ item.qty+=Number(qty.dataset.delta); if(item.qty<=0) ui.cart=ui.cart.filter(x=>x.id!==item.id); } return render(); }
  const remove = event.target.closest('[data-cart-remove]'); if(remove){ ui.cart=ui.cart.filter(x=>x.id!==remove.dataset.cartRemove); return render(); }
  const client = event.target.closest('[data-client-profile]'); if(client) return clientProfile(client.dataset.clientProfile);
  const employee = event.target.closest('[data-employee-profile]'); if(employee) return employeeProfile(employee.dataset.employeeProfile);
  const edit = event.target.closest('[data-edit-product]'); if(edit) return productModal(state.products.find(p=>p.id===edit.dataset.editProduct));
  const del = event.target.closest('[data-delete-product]'); if(del && confirm('¿Eliminar este producto?')){ state.products=state.products.filter(p=>p.id!==del.dataset.deleteProduct); saveState(); render(); toast('Producto eliminado'); return; }
  const ledger = event.target.closest('[data-ledger]'); if(ledger) return ledgerModal(ledger.dataset.client, ledger.dataset.ledger);
  const payment = event.target.closest('[data-payment]'); if(payment){ $$('.payment-option').forEach(b=>b.classList.remove('active')); payment.classList.add('active'); $('#paymentForm').dataset.payment=payment.dataset.payment; $('#cashReceived').style.display=payment.dataset.payment==='Efectivo'?'flex':'none'; return; }
  const tab = event.target.closest('[data-settings-tab]'); if(tab){ ui.settingsTab=tab.dataset.settingsTab; return render(); }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  const actions = {
    'close-modal': closeModal, 'product-add':()=>productModal(), 'client-add':()=>personModal('client'), 'employee-add':()=>personModal('employee'),
    'toggle-wholesale':()=>{ui.wholesale=!ui.wholesale;ui.cart=ui.cart.map(i=>{const p=state.products.find(x=>x.id===i.id);return{...i,price:ui.wholesale?p.wholesale:p.price}});render();},
    'clear-cart':()=>{ui.cart=[];render();}, 'open-payment':paymentModal, 'cash-movement':cashMovementModal,
    'export-products':()=>exportCSV('products'), 'export-clients':()=>exportCSV('clients'), 'export-employees':()=>exportCSV('employees'),
    'export-all':()=>{download(`grassi-respaldo-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json');toast('Respaldo completo generado');},
    'import-backup':()=>{ui.importType='backup';$('#importInput').click();}, 'import-products':()=>{ui.importType='products';$('#importInput').click();}, 'import-clients':()=>{ui.importType='clients';$('#importInput').click();}, 'import-employees':()=>{ui.importType='employees';$('#importInput').click();},
    'print-report':()=>window.print(), 'print-receipt':()=>{window.print();toast('Recibo enviado a impresión');},
    'close-register':()=>{ const ins=sum(state.cash.filter(m=>m.type==='in')), outs=sum(state.cash.filter(m=>m.type==='out')); state.closings.push({date:todayISO(),initial:500,incoming:ins,outgoing:outs,total:500+ins-outs});saveState();toast('Cierre de caja registrado');render(); },
    'reset-demo':()=>{if(confirm('¿Restaurar todos los datos de demostración?')){state=structuredClone(defaultState);saveState();render();toast('Datos de demostración restaurados');}}
  };
  actions[action]?.();
});

document.addEventListener('input', event => {
  if (event.target.id === 'globalSearch' || event.target.id === 'posSearch') { ui.search=event.target.value; render(); const input=$(event.target.id==='posSearch'?'#posSearch':'#globalSearch'); input?.focus(); input?.setSelectionRange(ui.search.length,ui.search.length); }
});

document.addEventListener('change', event => {
  if (event.target.id === 'saleClient') ui.clientId=event.target.value;
  if (event.target.id === 'stockFilter') { ui.productFilter=event.target.value; render(); }
});

document.addEventListener('submit', async event => {
  event.preventDefault(); const form=event.target; const data=Object.fromEntries(new FormData(form).entries());
  if(form.id==='productForm'){
    const product={ id:form.dataset.id||`P${String(Date.now()).slice(-6)}`, code:data.code, name:data.name, category:data.category, unit:data.unit, stock:Number(data.stock), minStock:Number(data.minStock), cost:Number(data.cost), price:Number(data.price), wholesale:Number(data.wholesale) };
    const index=state.products.findIndex(p=>p.id===product.id); if(index>=0) state.products[index]=product; else state.products.unshift(product); saveState();closeModal();render();toast(index>=0?'Producto actualizado':'Producto creado');
  }
  if(form.id==='clientForm'){
    const photo=await fileToDataURL(form.elements.photo.files[0]); state.clients.unshift({id:`C${Date.now()}`,name:data.name,type:data.type,phone:data.phone,document:data.document,balance:Number(data.balance||0),purchases:0,total:0,photo,ledger:[]});saveState();closeModal();render();toast('Cliente creado');
  }
  if(form.id==='employeeForm'){
    const photo=await fileToDataURL(form.elements.photo.files[0]); state.employees.unshift({id:`F${Date.now()}`,name:data.name,role:data.role,phone:data.phone,document:data.document,sales:0,total:0,ticket:0,hours:0,goal:0,photo});saveState();closeModal();render();toast('Funcionario creado');
  }
  if(form.id==='ledgerForm'){
    const c=state.clients.find(x=>x.id===form.dataset.client), amount=Number(data.amount), type=form.dataset.type; c.balance += type==='credit'?amount:-amount; c.ledger.push({date:new Date(`${data.date}T12:00:00`).toISOString(),type,description:data.description,amount});saveState();clientProfile(c.id);render();toast('Movimiento registrado');
  }
  if(form.id==='paymentForm') completeSale(form.dataset.payment,data.received);
  if(form.id==='cashMovementForm') { state.cash.unshift({id:`M${Date.now()}`,date:todayISO(),type:data.type,description:data.description,amount:Number(data.amount)});saveState();closeModal();render();toast('Movimiento registrado'); }
  if(form.id==='brandForm') { state.settings={...state.settings,...data,accent:form.elements.accent.value};saveState();render();toast('Identidad actualizada'); }
  if(form.id==='systemForm') { state.settings={...state.settings,language:data.language,currency:data.currency,wholesale:form.elements.wholesale.checked};saveState();render();toast('Preferencias guardadas'); }
});

$('#importInput').addEventListener('change', async event => {
  const file=event.target.files[0]; if(!file) return;
  try {
    const text=await file.text();
    if(ui.importType==='backup') {
      if(!file.name.toLowerCase().endsWith('.json')) throw new Error('Seleccione un respaldo JSON de GRASSI PDV.');
      const imported=JSON.parse(text); if(!imported.products||!imported.clients) throw new Error('Formato de respaldo inválido'); state={...structuredClone(defaultState),...imported};
    } else {
      const rows=parseCSV(text); if(!rows.length) throw new Error('El CSV no contiene registros válidos.');
      if(ui.importType==='products') state.products.push(...rows.map((r,i)=>({id:r.id||`P${Date.now()}${i}`,code:r.code||'',name:r.name||'Producto importado',category:r.category||'General',stock:Number(r.stock||0),minStock:Number(r.minStock||0),cost:Number(r.cost||0),price:Number(r.price||0),wholesale:Number(r.wholesale||r.price||0),unit:r.unit||'Unidad'})));
      if(ui.importType==='clients') state.clients.push(...rows.map((r,i)=>{let ledger=[];try{ledger=JSON.parse(r.ledger||'[]')}catch{}return{id:r.id||`C${Date.now()}${i}`,name:r.name||'Cliente importado',type:r.type||'Minorista',phone:r.phone||'',document:r.document||'',balance:Number(r.balance||0),purchases:Number(r.purchases||0),total:Number(r.total||0),photo:'',ledger};}));
      if(ui.importType==='employees') state.employees.push(...rows.map((r,i)=>({id:r.id||`F${Date.now()}${i}`,name:r.name||'Funcionario importado',role:r.role||'',phone:r.phone||'',document:r.document||'',sales:Number(r.sales||0),total:Number(r.total||0),ticket:Number(r.ticket||0),hours:Number(r.hours||0),goal:Number(r.goal||0),photo:''})));
    }
    saveState();render();toast('Datos importados correctamente');
  } catch(error) { toast(error.message || 'No fue posible importar el archivo','error'); }
  event.target.value='';
});

$('#menuBtn').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('show');});
$('#sidebarClose').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show');});
$('#overlay').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show');});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal'))closeModal();});

document.addEventListener('keydown', event => {
  if(event.key==='F2'){event.preventDefault();setView('pos');}
  if(event.key==='Escape') closeModal();
  if(event.key==='Enter' && event.target.id==='posSearch' && ui.search){ const p=state.products.find(x=>x.code===ui.search)||state.products.find(x=>x.name.toLowerCase().includes(ui.search.toLowerCase())); if(p){event.preventDefault();addCart(p.id);} }
});

setInterval(()=>{ const clock=$('#liveClock'); if(clock) clock.textContent=new Intl.DateTimeFormat('es-BO',{hour:'2-digit',minute:'2-digit'}).format(new Date()); },1000);
applyBrand(); injectIcons(); render();
