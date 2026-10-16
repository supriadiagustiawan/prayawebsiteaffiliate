import {access,readFile} from 'node:fs/promises';
const path=p=>new URL('../'+p,import.meta.url);
const required=['public/index.html','public/login.html','public/login.js','public/admin.js','netlify/lib/admin-template.mjs','public/app.js','public/style.css','public/praya-logo.png','public/praya-logo-dark.png','public/fonts/manrope.woff2','public/fonts/marykate.ttf','netlify/lib/seed.mjs'];
await Promise.all(required.map(p=>access(path(p))));
for(const p of ['public/index.html']){const text=await readFile(path(p),'utf8');const seed=JSON.parse(text.match(/<script id="seed-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);if(seed.products.some(p=>!['active','soldout'].includes(p.status)))throw Error('Draf tidak boleh tertanam pada HTML publik')}
console.log('Praya siap: aset publik, katalog, dan fungsi server tersedia');

try{await access(path('public/kelola.html'));throw Error('Halaman admin tidak boleh disimpan pada folder publik')}catch(e){if(e.code!=='ENOENT')throw e}
