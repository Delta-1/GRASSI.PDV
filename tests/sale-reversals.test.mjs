import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(){
 const sale={id:'V001',clientId:'c1',employeeId:'e1',date:'2026-10-17T16:00:00Z',payment:'Cuenta cliente',type:'Venta',total:300,amountPaid:150,status:'partial',receiptItems:[{id:'p1',lineId:'line1',qty:3,price:100,total:300}]};
 const state={sales:[sale],clients:[{id:'c1',balance:-150,total:300,purchases:1,ledger:[]}],products:[{id:'p1',stock:7}],employees:[{id:'e1',total:300,sales:1}],cash:[],settings:{options:{demoStockMovement:true}}};
 const ctx=vm.createContext({state,ui:{dailySalesDate:'2026-10-17',dailySalesSearch:'',dailySalesFilter:'pending'},document:{addEventListener(){}},window:{GRASSI_CONFIG:{mode:'demo'}},authSession:{name:'Usuario'},visibleSales:()=>state.sales});
 vm.runInContext(app.slice(app.indexOf('function saleIsActive('),app.indexOf('function showContextMenu(')),ctx);
 return {ctx,state,sale};
}
test('return first reduces outstanding debt and refunds only excess receipts',()=>{
 const {ctx,sale}=fixture();
 let value=ctx.reversalAmounts(sale,'return',[{itemId:'line1',quantity:1}]);
 assert.equal(value.amount,100);assert.equal(value.refund,0);assert.equal(value.all,false);
 sale.amountPaid=250;
 value=ctx.reversalAmounts(sale,'return',[{itemId:'line1',quantity:1}]);
 assert.equal(value.refund,50);
});
test('reversal updates stock, net debt, reporting and replay without duplicating money',()=>{
 const {ctx,state,sale}=fixture();
 const result={id:'request1',action:'return',amount:100,refund_amount:0,payment_method:'QR',items:[{itemId:'line1',productId:'p1',quantity:1,amount:100}]};
 ctx.applySaleReversal(sale,result);ctx.applySaleReversal(sale,result);
 assert.equal(state.products[0].stock,8);assert.equal(state.clients[0].balance,-50);assert.equal(state.clients[0].total,200);
 assert.equal(state.clients[0].purchases,1);assert.equal(ctx.saleRemaining(sale),50);assert.equal(ctx.salePaid(sale),150);
 const report=ctx.saleForReports(sale);assert.equal(report.total,200);assert.equal(report.receiptItems[0].qty,2);assert.equal(report.receiptItems[0].total,200);
 assert.equal(ctx.saleNetTotal(report),200);assert.equal(state.reversals.length,1);
});
test('cancel refunds earlier payments and prevents further collection',()=>{
 const {ctx,state,sale}=fixture();
 ctx.applySaleReversal(sale,{id:'cancel',action:'cancel',amount:300,refund_amount:150,payment_method:'PIX',items:[{itemId:'line1',productId:'p1',quantity:3,amount:300}]});
 assert.equal(sale.status,'cancelled');assert.equal(sale.isDeleted,true);
 assert.equal(ctx.saleRemaining(sale),0);assert.equal(ctx.salePaid(sale),0);assert.equal(ctx.saleNetTotal(sale),0);
 assert.equal(state.products[0].stock,10);assert.equal(state.clients[0].balance,0);assert.equal(state.cash[0].type,'out');assert.equal(state.cash[0].amount,150);assert.equal(state.clients[0].purchases,0);
});
test('fractional returns preserve the final cent and reject excess quantities',()=>{
 const {ctx,sale}=fixture();
 sale.total=1;sale.amountPaid=0;sale.receiptItems=[{id:'p1',lineId:'line1',qty:3,price:1/3,total:1,returnedQty:2,returnedAmount:.66}];sale.returnedTotal=.66;
 const value=ctx.reversalAmounts(sale,'return',[{itemId:'line1',quantity:1}]);
 assert.equal(value.amount,.34);assert.equal(value.all,true);
 assert.throws(()=>ctx.reversalAmounts(sale,'return',[{itemId:'line1',quantity:2}]));
 assert.throws(()=>ctx.reversalAmounts(sale,'return',[{itemId:'line1',quantity:.0001}]));
});
test('daily pending filter follows Cobija dates across UTC midnight',()=>{
 const {ctx,state,sale}=fixture();
 sale.date='2026-10-18T02:30:00Z';
 assert.equal(ctx.businessDay(sale.date),'2026-10-17');assert.equal(ctx.dailySalesRows().length,1);
 sale.isDeleted=true;assert.equal(ctx.dailySalesRows().length,0);
});
test('payment preserves persisted receipts even if the local ledger is incomplete',()=>{
 const {ctx,state,sale}=fixture();
 ctx.newClientSaleId=()=>crypto.randomUUID();
 vm.runInContext(app.slice(app.indexOf('function applyAccountPayment('),app.indexOf('async function submitSalePayment(')),ctx);
 ctx.applyAccountPayment(state.clients[0],150,'QR','',sale,null);
 assert.equal(sale.amountPaid,300);assert.equal(ctx.saleRemaining(sale),0);assert.equal(state.clients[0].balance,0);
});
test('remote reversal forwards the PIN only to the RPC and surfaces supervisor errors',async()=>{
 const backend=readFileSync(new URL('../backend.js',import.meta.url),'utf8'),calls=[];
 const ctx=vm.createContext({window:{GRASSI_CONFIG:{mode:'supabase',supabaseUrl:'https://database.example',supabasePublishableKey:'public'}},navigator:{onLine:true},localStorage:{getItem:()=>JSON.stringify({businessId:'b1',accessToken:'session'}),setItem(){}},fetch:async(url,options)=>{calls.push({url,options});return{ok:true,status:200,json:async()=>({error:'Contraseña del supervisor incorrecta'})}}});
 vm.runInContext(backend,ctx);await ctx.window.GrassiBackend.restoreSession();
 await assert.rejects(ctx.window.GrassiBackend.reverseSale({saleId:'s1',action:'cancel',items:null,method:'QR',reason:'QA',pin:'secret-pin',requestId:'req'}),/supervisor incorrecta/);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://database.example/rest/v1/rpc/reverse_sale');
 const payload=JSON.parse(calls[0].options.body);assert.equal(payload.p_business_id,'b1');assert.equal(payload.p_pin,'secret-pin');assert.equal(payload.p_request_id,'req');
});
