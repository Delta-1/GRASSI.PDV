import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const app = read('app.js');
const backend = read('backend.js');
const styles = read('styles.css');
const experience = read('pdv-experience.js');
const pdvHtml = read('pdv.html');

test('interface scale has three proportional choices and Supabase persistence', () => {
  assert.match(app, /scale:'medium'/);
  assert.match(app, /\['small','medium','large'\]\.includes\(appearance\.scale\)/);
  for (const size of ['small', 'medium', 'large']) {
    assert.match(app, new RegExp(`\\['${size}'|,'${size}'|'${size}',`));
  }
  assert.match(styles, /data-scale="small"/);
  assert.match(styles, /data-scale="large"/);
  assert.match(app, /name="scale"/);
  assert.match(app, /state\.settings\.appearance=\{mode:d\.mode,palette,accent,shell,scale\}/);
  assert.match(backend, /theme:\s*\{\s*\.\.\.\(appearance\s*\|\|/);
  assert.match(experience, /html\[data-scale="large"\]\{font-size:18px\}/);
  assert.match(experience, /pos-touch-shortcuts button\{min-height:104px/);
});

test('Minimum is a distinct GRASSI shell and PDV theme', () => {
  assert.match(experience, /value="minimum"/);
  assert.match(experience, /Minimum GRASSI/);
  assert.match(experience, /data-shell="minimum"/);
  assert.match(experience, /pdv\.pos-theme-minimum/);
  assert.match(experience, /PASSE OU BUSQUE O PRODUTO/);
  assert.doesNotMatch(experience, /LC sistemas|LC WEB|LCsistemas/i);
});

test('remote login accepts the MARCOS username without storing a password in source', () => {
  assert.match(experience, /usernameDomain = '@grassi\.local'/);
  assert.match(experience, /principalLoginEmail = 'admin@grassi\.local'/);
  assert.match(experience, /normalized === 'marcos'/);
  assert.match(experience, /Ingrese su usuario/);
  assert.match(experience, /Digite seu usuário/);
  assert.doesNotMatch(experience, /MARCOS ou nome@empresa\.com|MARCOS o nombre@empresa\.com|Usuario o correo|Usuário ou e-mail/);
  assert.match(experience, /normalized\.includes\('@'\)/);
  assert.doesNotMatch(experience, /12345678/);
});

test('standalone PDV remembers user profiles but always asks for a password', () => {
  assert.match(experience, /grassi\.pdv\.profiles\.v1/);
  assert.match(experience, /Quem vai usar o PDV\?/);
  assert.match(experience, /Escolha seu perfil e digite apenas a senha\./);
  assert.match(experience, /profiles\.unshift\(\{userId: session\.userId \|\| session\.email, name: session\.name, email: session\.email, role: session\.role \|\| 'employee'\}\)/);
  assert.match(pdvHtml, /sessionStorage\.removeItem\('grassi\.pos\.unlocked'\)/);
});

test('Minimum stays dark and Venta rápida can collapse completely', () => {
  assert.match(experience, /pos-theme-minimum \.suggestions/);
  assert.match(experience, /pos-theme-minimum \.qty-stepper/);
  assert.match(experience, /pdv\.sidebar-collapsed \.pdv-sidebar\{display:none!important\}/);
  assert.match(experience, /pdv\.sidebar-collapsed \.pos-panel-reopen\{display:flex!important\}/);
});

test('PDV shortcuts provide notebook alternatives and stay readable', () => {
  for (const shortcut of ['Alt+A', 'Alt+B', 'Alt+C', 'Alt+M', 'Alt+P', 'Alt+Q', 'Ctrl+Enter', 'Ctrl+Supr']) {
    assert.match(app, new RegExp(shortcut.replace('+', '\\+')));
  }
  assert.match(app, /e\.code\?\.startsWith\('F'\)/);
  assert.match(app, /const altCommands=/);
  assert.match(app, /checkout-key-list/);
  assert.match(styles, /Atalhos legíveis e confiáveis em notebooks/);
  assert.match(styles, /min-width:721px\) and \(max-width:1100px\).*\.pos-touch-shortcuts span\{display:block/s);
});

test('reports render distinct operational data sets', () => {
  const reports = [
    'Resumen', 'Rentabilidad', 'Ingresos / gastos', 'Medios de pago', 'Por vendedor',
    'Por producto', 'Horario pico', 'Ticket promedio', 'Ranking de ventas',
    'Compras por cliente', 'Movimiento de stock', 'Stock bajo', 'Valor del inventario',
    'Movimientos de caja', 'Cierres anteriores', 'Por vencer', 'Pagadas',
  ];
  for (const report of reports) assert.match(app, new RegExp(report.replace('/', '\\/')));
  assert.match(app, /function reportContent\(reportSales\)/);
  assert.match(app, /function reportProductRows\(sales\)/);
  assert.match(app, /function reportGroupRows\(rows,keyFn\)/);
  assert.match(app, /data-report-select/);
  assert.match(styles, /Central de relatórios operacionais/);
});
