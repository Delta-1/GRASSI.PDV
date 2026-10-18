import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const studio=readFileSync(new URL('../document-studio.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(sales=[]){
 const ctx=vm.createContext({state:{sales},sum:(rows,key)=>rows.reduce((n,row)=>n+Number(row[key]||0),0)});
 vm.runInContext(app.slice(app.indexOf('function cashMethod('),app.indexOf('\n',app.indexOf('function cashMethod(')))+studio.slice(studio.indexOf('function cashPaymentSummary('),studio.indexOf('function cashTransactionRows(')),ctx);
 return ctx;
}
test('closing has only four default methods including cheque',()=>{
 const rows=fixture().cashPaymentSummary([],[]);
 assert.deepEqual(Array.from(rows,row=>row.method),['Efectivo','PIX','QR','Cheque']);
 assert.equal(rows.reduce((n,row)=>n+row.total,0),0);
});
test('cheque sale and account collection are counted once, with refunds in cheque',()=>{
 const sales=[{id:'V1',payment:'Cheque',total:100},{id:'V2',payment:'Cuenta cliente',total:300}];
 const movements=[{type:'in',amount:100,saleId:'V1',description:'Venta V1 — Cheque'},
 {type:'in',amount:50,description:'Pago Cheque — Venta V2 — banco / cheque 123'},
 {type:'out',amount:20,paymentMethod:'Cheque',description:'Reembolso Cheque — Venta V1'},
 {type:'out',amount:10,description:'Retiro de efectivo'},{type:'in',amount:30,description:'Fondo de apertura'}];
 const rows=fixture(sales).cashPaymentSummary(sales,movements),cheque=rows.find(row=>row.method==='Cheque'),cash=rows[0];
 assert.equal(cheque.sales,150);assert.equal(cheque.returns,20);assert.equal(cheque.total,130);
 assert.equal(cash.sangria,10);assert.equal(cash.supplement,30);assert.equal(cash.total,20);
 assert.equal(rows.reduce((n,row)=>n+row.total,0),150);
});
test('historical card and transfer amounts remain in totals without repeated card rows',()=>{
 const sales=[{payment:'Tarjeta crédito',total:70},{payment:'Transferencia',total:30}];
 const rows=fixture().cashPaymentSummary(sales,[]);
 assert.equal(rows.length,5);assert.equal(rows[4].method,'Otros medios registrados');
 assert.equal(rows[4].total,100);assert.equal(rows.reduce((n,row)=>n+row.total,0),100);
});

test('cancelled sales still reconcile original receipt and cheque refund in closing',()=>{
 const movements=[{type:'in',amount:100,description:'Venta V9 — Cheque'},
 {type:'out',amount:100,paymentMethod:'Cheque',description:'Reembolso Cheque — Venta V9'}];
 const rows=fixture().cashPaymentSummary([],movements),cheque=rows.find(row=>row.method==='Cheque');
 assert.equal(cheque.sales,100);assert.equal(cheque.returns,100);assert.equal(cheque.total,0);
});
