const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {submitRegistrationWithRetry}=require('../assets/registration-reliability.js');
const requestId='12345678-1234-4234-8234-123456789abc';
const payload={action:'submit',requestId,businessName:'QA only',ownerName:'QA',mobile:'9000000099',whatsapp:'9000000099',category:'Photographers & Films',district:'Didwana-Kuchaman',city:'Didwana',services:'QA'};
function backend(){
 const rows=[],lock={held:false,waitLock(){assert.equal(this.held,false);this.held=true},releaseLock(){this.held=false}};
 const ctx={SpreadsheetApp:{flush(){}},LockService:{getScriptLock:()=>lock},Logger:{log(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({getContent:()=>s,setMimeType(){return this}})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),formatDate:(_,tz,pattern)=>pattern.includes('HH')?'20261118-230000':'2026-11-18'}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../apps-script/production.gs'),'utf8'),ctx);
 rows.push(vm.runInContext('HEADERS.slice()',ctx));
 const sheet={getLastColumn:()=>rows[0].length,getDataRange:()=>({getDisplayValues:()=>rows}),getRange:(r,c,n,m)=>({getDisplayValues:()=>rows.slice(r-1,r-1+(n||1)).map(x=>x.slice(c-1,c-1+(m||1))),setValue:v=>{rows[r-1]??=[];rows[r-1][c-1]=v;}}),appendRow:r=>rows.push(r)};
 ctx.getSheet_=()=>sheet;ctx.getUploadFolder_=()=>({});ctx.saveFile_=()=>'';
 return {ctx,rows,lock,submit:b=>JSON.parse(ctx.submitVendor_(b).getContent())};
}
test('transport failure retries the identical opaque request and confirms acknowledgement',async()=>{
 const bodies=[];let n=0;const result=await submitRegistrationWithRetry('https://example.invalid',payload,async(_,opts)=>{bodies.push(opts.body);if(n++===0)throw Error('lost reply');return {ok:true,json:async()=>({ok:true,id:'RWG-QA'})}},async()=>{});
 assert.equal(result.id,'RWG-QA');assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);
});
test('unreadable acknowledgement can be reconciled by a safe repeat',async()=>{
 let n=0;await submitRegistrationWithRetry('x',payload,async()=>({ok:true,json:async()=>{if(n++===0)throw Error('HTML');return {ok:true,id:'RWG-QA'}}}),async()=>{});assert.equal(n,2);
});
test('confirmed validation failure never retries',async()=>{
 let calls=0;await assert.rejects(submitRegistrationWithRetry('x',payload,async()=>{calls++;return {ok:true,json:async()=>({ok:false,error:'Invalid photo'})}},async()=>{}),/Invalid photo/);assert.equal(calls,1);
});
test('permanent HTTP failures never retry',async()=>{
 let calls=0;await assert.rejects(submitRegistrationWithRetry('x',payload,async()=>{calls++;return {ok:false,status:403}},async()=>{}));assert.equal(calls,1);
});
test('unavailable backend stops after three attempts',async()=>{
 let calls=0;await assert.rejects(submitRegistrationWithRetry('x',payload,async()=>{calls++;throw Error('network')},async()=>{}));assert.equal(calls,3);
});
test('repeating a saved request appends exactly one row',()=>{
 const b=backend(),first=b.submit(payload),again=b.submit(payload);assert.equal(first.ok,true);assert.equal(again.id,first.id);assert.equal(again.replayed,true);assert.equal(b.rows.length,2);assert.equal(b.lock.held,false);
});
test('changed content cannot reuse a saved request ID',()=>{
 const b=backend();b.submit(payload);const r=b.submit({...payload,businessName:'Changed'});assert.equal(r.ok,false);assert.equal(r.code,'REQUEST_CHANGED');assert.equal(b.rows.length,2);
});
test('header reordering preserves submission ID and pending status',()=>{
 const b=backend();b.rows[0].reverse();const result=b.submit(payload);assert.equal(b.rows[1][b.rows[0].indexOf('Submission ID')],result.id);assert.equal(b.rows[1][b.rows[0].indexOf('Status')],'Pending Approval');
});
test('failed photo upload leaves no row and releases lock',()=>{
 const b=backend();b.ctx.saveFile_=()=>{throw Error('Photo upload unavailable')};assert.throws(()=>b.submit({...payload,logo:{type:'image/png',data:'x'}}));assert.equal(b.rows.length,1);assert.equal(b.lock.held,false);
});
test('legacy form without request ID remains compatible',()=>{const b=backend(),p={...payload};delete p.requestId;assert.equal(b.submit(p).ok,true);assert.equal(b.rows.length,2)});
