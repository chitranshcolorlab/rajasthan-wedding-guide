'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const catalog=require('../vendor-catalog.json');
const BASE='https://rajasthanweddingguide.com/';
const API='https://script.google.com/macros/s/AKfycbz8SfXfcYwH5giymrCmKOGf9w_kmXjXGBiQ6CtrI2Btl7K3zDja5xcLGOwSEtD-XwM8eg/exec';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonScript=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function safeUrl(v){try{const u=new URL(String(v));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function phone(v){const n=String(v||'').replace(/\D/g,'');return /^(?:91)?[6-9]\d{9}$/.test(n)?(n.length===10?'91'+n:n):''}
const fields=['Submission ID','Business Name','Mobile','WhatsApp','Category','District','City','About Business','Services','Starting Price','Years in Business','Service Areas','Languages','Specialities','Full Address','Logo URL','Photo URLs','Website','Instagram','Facebook','Google Maps','Portfolio Link','Status'];
function categoryPath(v){const c=catalog.categories.find(c=>c[0]===v.Category);return `rajasthan/${slug(v.District)}/${slug(v.City)}/${c[1]}/`;}
function render(v,base){
 const url=base+'vendors/'+v.Slug+'/',name=v['Business Name'];
 const desc=`${name} — ${v.Category} in ${v.City}, Rajasthan. ${v.Services}`.slice(0,300);
 const logo=safeUrl(v['Logo URL']);
 const schema={'@context':'https://schema.org','@type':'LocalBusiness',name,url,description:desc,telephone:'+'+phone(v.Mobile),address:{'@type':'PostalAddress',addressLocality:v.City,addressRegion:'Rajasthan',addressCountry:'IN'},...(logo?{image:logo}:{})};
 const css='*{box-sizing:border-box}body{margin:0;background:#f7f3eb;color:#171717;font:17px Arial;overflow-wrap:anywhere}header{background:#111;color:#e0c78e;padding:22px}main{max-width:1050px;margin:auto;padding:25px}h1{font-size:clamp(26px,5vw,46px)}section{background:white;padding:25px;border-radius:16px;margin:20px 0}p{white-space:pre-line;line-height:1.7}a{color:#76571f}.buttons{display:flex;gap:14px;flex-wrap:wrap}.buttons a{padding:14px;background:#111;color:#e0c78e;border-radius:24px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px}.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px}.logo{width:100px;height:100px;object-fit:cover}';
 return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>${escape(name)} | Rajasthan Wedding Guide</title><meta name="description" content="${escape(desc)}"><link rel="canonical" href="${escape(url)}"><meta property="og:title" content="${escape(name)}"><meta property="og:description" content="${escape(desc)}"><meta property="og:url" content="${escape(url)}"><meta property="og:type" content="website">${logo?`<meta property="og:image" content="${escape(logo)}">`:''}<style>${css}</style><script type="application/ld+json">${jsonScript(schema)}</script></head><body><header>Rajasthan Wedding Guide</header><main><a href="../../${categoryPath(v)}">${escape(v.Category)} in ${escape(v.City)}</a><section>${logo?`<img class="logo" src="${escape(logo)}" alt="${escape(name)} owner photo">`:''}<h1>${escape(name)}</h1><p>${escape(v.Category)} · ${escape(v.City)} · ${escape(v.District)}</p><div class="buttons"><a href="tel:+${phone(v.Mobile)}">Call Now</a><a href="https://wa.me/${phone(v.WhatsApp)}?text=${encodeURIComponent("नमस्कार, मुझे आपका नंबर Rajasthan Wedding Guide से मिला है। मुझे आपकी सेवाओं के बारे में जानकारी चाहिए।")}" rel="noopener" target="_blank">WhatsApp Enquiry</a></div></section><section><h2>Business Description</h2><p>${escape(v['About Business']||v.Services)}</p></section></main></body></html>`;
}
function prepare(rows,history){
 if(!Array.isArray(rows))throw Error('Invalid vendor list');
 const ids=new Set(),used=new Set(Object.values(history));
 return rows.map(raw=>{
  if(raw.Status!=='Approved')throw Error('Unapproved vendor in production API');
  const v=Object.fromEntries(fields.map(k=>[k,String(raw[k]??'')])),id=v['Submission ID'];
  if(!id||ids.has(id)||!v['Business Name']||!phone(v.Mobile)||!phone(v.WhatsApp))throw Error('Invalid or duplicate vendor');
  if(/^TEST\s|^DEV\s|\bDummy\b/i.test(v['Business Name']))throw Error('Test fixture cannot enter production');
  if(!catalog.locations[v.District]?.includes(v.City)||!catalog.categories.some(c=>c[0]===v.Category))throw Error('Invalid vendor location/category');
  ids.add(id);
  let route=Object.prototype.hasOwnProperty.call(history,id)?history[id]:'';
  if(!route){
   const stem=(slug(v['Business Name']).slice(0,90)||'vendor')+'-'+crypto.createHash('sha256').update(id).digest('hex').slice(0,12);
   route='vendors/'+stem+'/';
   if(used.has(route))throw Error('Profile route collision');history[id]=route;used.add(route);
  }
  if(!/^(?:vendors\/[a-z0-9-]+|rajasthan\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+)\/$/.test(route))throw Error('Unsafe profile route');
  v.profilePath=route;v.Slug=route.split('/').filter(Boolean).at(-1);return v;
 });
}
function publish(rows,dir){
 const historyFile=path.join(dir,'vendor-profile-history.json');
 const history=fs.existsSync(historyFile)?JSON.parse(fs.readFileSync(historyFile,'utf8')):{};
 const vendors=prepare(rows,history),staging=path.join(dir,'.vendors-next');
 fs.rmSync(staging,{recursive:true,force:true});fs.mkdirSync(staging,{recursive:true});fs.writeFileSync(path.join(staging,'.gitkeep'),'');
 for(const v of vendors)if(v.profilePath.startsWith('vendors/')){
  const target=path.join(staging,v.Slug);fs.mkdirSync(target);fs.writeFileSync(path.join(target,'index.html'),render(v,BASE));
 }else if(!fs.existsSync(path.join(dir,v.profilePath,'index.html')))throw Error('Existing premium profile missing');
 // Validation completes before managed output is replaced. Premium pages stay outside this directory.
 fs.rmSync(path.join(dir,'vendors'),{recursive:true,force:true});fs.renameSync(staging,path.join(dir,'vendors'));
 fs.writeFileSync(path.join(dir,'approved-vendors.json'),JSON.stringify({ok:true,items:vendors},null,2)+'\n');
 fs.writeFileSync(historyFile,JSON.stringify(history,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'sitemap-vendors.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+vendors.map(v=>'<url><loc>'+BASE+v.profilePath+'</loc></url>').join('')+'</urlset>\n');
 return vendors.length;
}
async function main(){
 const response=await fetch(API+'?action=list',{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Production API HTTP '+response.status);
 const data=await response.json();if(data.ok!==true||!Array.isArray(data.items))throw Error('Invalid production API acknowledgement');
 if(data.items.some(v=>['Email','Review Notes','Owner Name'].some(k=>k in v)))throw Error('Public API privacy regression');
 console.log(JSON.stringify({environment:'production',approvedVendors:publish(data.items,process.cwd())}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={prepare,publish,render};
