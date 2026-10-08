import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(){
 const sale={id:'V001',clientId:'c1',client:'Cliente',payment:'Cuenta cliente',type:'Venta',total:100,receiptItems:[{id:'p1',qty:1,price:100}],amountPaid:40};
 const client={id:'c1',name:'Cliente',balance:-60,purchases:1,total:100,ledger:[{id:'debit',type:'debit',amount:100,saleId:'V001',description:'Venta #V001'},{id:'payment',type:'credit',amount:40,saleId:'V001',paymentMethod:'PIX'}]};
 const state={sales:[sale],clients:[client],products:[{id:'p1',stock:9}],cash:[{id:'cash',saleId:'V001',type:'in',amount:40}],employees:[],settings:{options:{demoStockMovement:true,blockNoStock:true}}};
 const ctx=vm.createContext({state,window:{GRASSI_CONFIG:{mode:'demo'}},authSession:{name:'Usuario'},newClientSaleId:()=>crypto.randomUUID()});
 vm.runInContext(app.slice(app.indexOf('function salePaid('),app.indexOf('function showContextMenu('))+app.slice(app.indexOf('function reconcileEditedSaleLocally('),app.indexOf('async function updateExistingSale('))+app.slice(app.indexOf('function applyAccountPayment('),app.indexOf('async function submitSalePayment(')),ctx);
 return {ctx,state,sale,client};
}
test('editing an account sale preserves partial payments and cash and adjusts stock/debt once',()=>{
 const {ctx,state,sale,client}=fixture();
 ctx.reconcileEditedSaleLocally(sale,{clientId:'c1',client:'Cliente',total:200,receiptItems:[{id:'p1',qty:2,price:100}]});
 assert.equal(state.products[0].stock,8);assert.equal(client.balance,-160);assert.equal(client.purchases,1);assert.equal(client.total,200);
 assert.equal(state.cash[0].amount,40);assert.equal(client.ledger.filter(e=>e.type==='credit').length,1);
 assert.equal(ctx.salePaid(sale),40);assert.equal(ctx.saleRemaining(sale),160);
});
test('a final payment settles its sale and client without changing inventory or duplicating on replay',()=>{
 const {ctx,state,sale,client}=fixture();
 ctx.applyAccountPayment(client,60,'Efectivo','',sale,{movementId:'final',cashId:'cash-final',amountPaid:100});
 assert.equal(client.balance,0);assert.equal(sale.status,'completed');assert.equal(ctx.saleRemaining(sale),0);
 assert.equal(state.products[0].stock,9);assert.equal(state.sales.length,1);assert.equal(state.cash.reduce((n,m)=>n+m.amount,0),100);
 ctx.applyAccountPayment(client,60,'Efectivo','',sale,{movementId:'final',cashId:'cash-final',amountPaid:100});
 assert.equal(client.balance,0);assert.equal(state.cash.length,2);
});
test('persisted paid totals remain valid when the loaded ledger is paginated',()=>{
 const {ctx,sale,client}=fixture();client.ledger=[];sale.amountPaid=75;
 assert.equal(ctx.salePaid(sale),75);assert.equal(ctx.saleRemaining(sale),25);
});
