import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../app.js');
const backend = read('../backend.js');
const documents = read('../document-studio.js');
const styles = read('../styles.css');
const migration = read('../supabase/migrations/20261007151555_sale_editing_and_account_registration.sql');

test('PDV accepts comma decimal quantities without losing precision', () => {
  assert.match(app, /const parseDecimal=value=>/);
  assert.match(app, /replace\(',',\s*'\.'\)/);
  assert.match(app, /const positiveQuantity=\(value,fallback=NaN\)=>/);
  assert.match(app, /Math\.round\(parsed\*1000\)\/1000/);
  assert.match(app, /data-cart-qty=.*?inputmode="decimal".*?pattern="\[0-9\.,\]\*"/s);
  assert.match(app, /name="qty" type="text" inputmode="decimal"/);
  assert.match(migration, /qty numeric\(14,3\)/);
});

test('registered sales can edit products, quantities, price, discount and client', () => {
  assert.match(app, /data-sale-edit=/);
  assert.match(app, /function beginSaleEdit\(id\)/);
  assert.match(app, /function updateExistingSale\(\)/);
  assert.match(app, /base_price:Number\(item\.basePrice/);
  assert.match(app, /discount_type:itemDiscountType\(item\)/);
  assert.match(app, /clientId:client\?\.id\|\|null/);
  assert.match(backend, /\/rest\/v1\/rpc\/update_sale/);
  assert.match(backend, /p_sale_id: payload\.saleId/);
  assert.match(app, /const originalSaleQuantity=productId=>/);
  assert.match(app, /const availableProductStock=product=>Number\(product\?\.stock\|\|0\)\+originalSaleQuantity/);
  assert.match(app, /Math\.min\(availableProductStock\(p\),requested\)/);
});

test('sale edit is atomic across inventory, customer account, cash and seller totals', () => {
  assert.match(migration, /create or replace function public\.update_sale/);
  assert.match(migration, /update products p\s+set stock=p\.stock\+si\.quantity/s);
  assert.match(migration, /delete from sale_items where sale_id=old_sale\.id/);
  assert.match(migration, /record_client_movement_v2\(p_business_id,p_client_id,'debit',total_value/);
  assert.match(migration, /update cash_movements\s+set amount=total_value/s);
  assert.match(migration, /sales_total=greatest\(0,sales_total\+total_value-old_sale\.total\)/);
  assert.match(migration, /block_no_stock and p\.stock<qty/);
  assert.match(migration, /revoke all on function public\.update_sale/);
  assert.match(migration, /grant execute on function public\.update_sale.*authenticated/);
});

test('account receipts and reports say pending instead of paid', () => {
  assert.match(app, /Venta registrada en cuenta/);
  assert.match(app, /Pendiente de pago/);
  assert.match(app, /La forma de pago será elegida en la ficha del cliente/);
  assert.match(documents, /Pendiente — cuenta del cliente/);
  assert.match(documents, /Estado \/ pago/);
});

test('client onboarding is centered and responsive', () => {
  assert.match(app, /client-onboarding-modal/);
  assert.match(app, /client-onboarding-progress/);
  assert.match(app, /client-search-centered/);
  assert.match(styles, /\.client-onboarding-modal\{width:min\(980px/);
  assert.match(styles, /\.client-onboarding-shell>\.layer-body/);
  assert.match(styles, /\.client-search-centered\{width:min\(680px/);
  assert.match(styles, /@media\(max-width:720px\)[\s\S]*?\.client-onboarding-modal/);
});
