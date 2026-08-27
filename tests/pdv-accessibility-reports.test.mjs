import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const app = read('app.js');
const backend = read('backend.js');
const styles = read('styles.css');

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
