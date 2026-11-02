'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('category cards keep vendor text inert, reject unsafe media and use the clean profile route',async()=>{
 const source=fs.readFileSync('scripts/generate-seo.js','utf8'),start=source.indexOf('function categoryClient(config){'),end=source.indexOf('\nif(!IS_PROD)',start);
 const root={children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)}},created=[];
 function element(tag){const e={tag,children:[],style:{},append(x){this.children.push(x)}};Object.defineProperty(e,'innerHTML',{set(){throw Error('Vendor HTML must never be injected')}});created.push(e);return e;}
 const name='<img src=x onerror=alert(1)>',fixture={'Submission ID':'fixture','Status':'Approved','Business Name':name,'Services':'<script>alert(1)</script>','District':'Didwana-Kuchaman','City':'Didwana','Category':'Photographers & Films','Logo URL':'javascript:alert(1)'};
 const ctx={document:{getElementById:()=>root,createElement:element},location:{origin:'https://rajasthanweddingguide.com'},URL,Date,fetch:async u=>({ok:true,json:async()=>u.startsWith('/approved')?{items:[{'Submission ID':'fixture',profilePath:'vendors/fixture/'}]}:{ok:true,items:[fixture]}})};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.categoryClient({api:'https://api.invalid',district:'Didwana-Kuchaman',city:'Didwana',category:'Photographers & Films',aliases:{},thumbs:{},premium:{}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(root.children.length,1);assert.equal(created.some(e=>e.tag==='img'),false);assert.equal(created.find(e=>e.tag==='b').textContent,name);assert.equal(created.find(e=>e.tag==='a').href,'/vendors/fixture/');
});
