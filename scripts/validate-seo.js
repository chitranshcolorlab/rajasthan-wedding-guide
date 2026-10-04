const fs=require('fs'),path=require('path');
const ROOT=path.resolve('rajasthan'), PROD='https://rajasthanweddingguide.com/';
const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p):e.name==='index.html'&&files.push(p)}}
walk(ROOT);
const expected=3530, errors=[], canon=new Map();
const approved=fs.existsSync('approved-seo.json')?JSON.parse(fs.readFileSync('approved-seo.json','utf8')):{keys:[]};
let indexableCount=0;
function relTarget(from,href){
  if(!href||/^(https?:|mailto:|tel:|javascript:|#)/i.test(href)||href.includes("'")||href.includes('+'))return null;
  const clean=href.split('?')[0].split('#')[0]; if(!clean)return null;
  let p=clean.startsWith('/')?path.resolve('.'+clean):path.resolve(path.dirname(from),clean);
  if(clean.endsWith('/'))p=path.join(p,'index.html');
  else if(!path.extname(p))p=path.join(p,'index.html');
  return p;
}
for(const file of files){
 const c=fs.readFileSync(file,'utf8');
 if(/DEV SEO system/.test(c))errors.push(file+': DEV warning in production build');
 const isIndex=/name="robots" content="index,follow"/.test(c), isNoindex=/name="robots" content="noindex,nofollow"/.test(c); if(isIndex)indexableCount++; if(!isIndex&&!isNoindex)errors.push(file+': robots directive missing');
 const m=c.match(/rel="canonical" href="([^"]+)"/); if(!m)errors.push(file+': canonical missing');
 else {const u=m[1]; if(!u.startsWith(PROD))errors.push(file+': bad canonical '+u); if(canon.has(u))errors.push(file+': duplicate canonical with '+canon.get(u)); else canon.set(u,file);}
 const hrefs=[...c.matchAll(/href=["']([^"']+)["']/g)].map(x=>x[1]);
 for(const h of hrefs){const t=relTarget(file,h); if(t&&t.includes(path.resolve('rajasthan'))&&!fs.existsSync(t))errors.push(file+': broken internal '+h);}
 if(file.split(path.sep).length>=5 && file!==path.join('rajasthan','index.html')){
   if(c.includes('Approved ')&&!c.includes('../../../../vendor.html?id='))errors.push(file+': vendor profile link missing');
 }
}
const sitemap=fs.readFileSync('sitemap-seo.xml','utf8'), urls=(sitemap.match(/<url>/g)||[]).length;
if(files.length!==expected)errors.push('page count '+files.length+' expected '+expected);
if(urls!==approved.keys.length)errors.push('sitemap count '+urls+' expected approved combinations '+approved.keys.length);
if(indexableCount!==approved.keys.length)errors.push('indexable page count '+indexableCount+' expected '+approved.keys.length);
if(canon.size!==expected)errors.push('unique canonical count '+canon.size+' expected '+expected);
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',pages:files.length,sitemapUrls:urls,indexablePages:indexableCount,approvedCombinations:approved.keys.length,uniqueCanonicals:canon.size,errors:errors.slice(0,100)},null,2));
if(errors.length)process.exit(1);
