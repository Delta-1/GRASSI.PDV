import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const studio = read('document-studio.js');
const app = read('app.js');
const backend = read('backend.js');
const styles = read('styles.css');

for (const id of ['cash-closing', 'sale-receipt', 'zona-franca-invoice']) {
  assert.match(studio, new RegExp(`['"]${id}['"]`), `modelo ${id} deve existir`);
}

assert.match(studio, /data-reference-template/, 'modelos especiais devem ser identificáveis');
assert.match(studio, /REQUIERE HOMOLOGACIÓN DEL SIN/, 'factura deve expor aviso de homologação');
assert.match(studio, /openSaleReceipt/, 'API do recibo deve estar disponível');
assert.match(studio, /openZonaFrancaInvoice/, 'API da factura deve estar disponível');
assert.match(app, /data-doc-sale-receipt/, 'venda deve oferecer recibo A4');
assert.match(app, /data-doc-zona-invoice/, 'venda deve oferecer factura de Zona Franca');
assert.match(studio, /DADOS DO CLIENTE/, 'informe A4 deve seguir o modelo físico enviado');
assert.match(studio, /PEDIDOS AL CEL\./, 'informe A4 deve manter o rodapé operacional do modelo');
assert.match(studio, /saleItemsWithBlanks\(sale,8\)/, 'informe A4 deve reservar oito linhas de produtos');

for (const field of ['zone', 'pointOfSale', 'authorizationCode']) {
  assert.match(app, new RegExp(`name=['"]${field}['"]`), `${field} deve ser configurável`);
  assert.match(backend, new RegExp(`${field}: settings\\.${field}`), `${field} deve persistir no Supabase`);
}

assert.match(app, /name="saleReceiptTemplate"/, 'configurações devem permitir escolher o modelo do recibo');
assert.match(studio, /saleReceiptTemplate==='modern'/, 'renderização deve alternar entre modelo clássico e moderno');
assert.match(backend, /saleReceiptTemplate: settings\.saleReceiptTemplate/, 'modelo escolhido deve persistir no Supabase');
assert.match(studio, /const styles=\{official:'Oficial tabular'\}/, 'todos os documentos devem usar apenas o padrão oficial');
assert.match(studio, /style:'official',accent:'#111111'/, 'configuração salva não deve reativar estilos decorativos');
assert.match(styles, /Padrão oficial tabular para todos os documentos gerados/, 'relatórios genéricos devem possuir grade oficial própria');
assert.match(styles, /style-official:not\(\.reference-document\).*border:1px solid #222/, 'documentos oficiais devem usar bordas tabulares pretas');

for (const cssClass of ['reference-cash', 'reference-receipt', 'reference-zona']) {
  assert.match(styles, new RegExp(`\\.${cssClass}`), `${cssClass} deve possuir estilo próprio`);
}

assert.match(studio, /saveGeneratedDocument/, 'documentos gerados devem manter histórico persistente');
console.log('Relatórios de referência: contratos verificados.');
