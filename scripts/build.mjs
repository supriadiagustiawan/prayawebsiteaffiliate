import {access,readFile,rm} from 'node:fs/promises';
const path=p=>new URL('../'+p,import.meta.url);
const required=['public/index.html','public/login.html','public/login.js','public/admin.js','netlify/lib/admin-template.mjs','public/app.js','public/style.css','public/praya-logo.png','public/praya-logo-dark.png','public/fonts/manrope.woff2','public/fonts/marykate.ttf','netlify/lib/seed.mjs'];
await Promise.all(required.map(p=>access(path(p))));
for(const p of ['public/index.html']){const text=await readFile(path(p),'utf8');const seed=JSON.parse(text.match(/<script id="seed-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);if(seed.products.some(p=>!['active','soldout'].includes(p.status)))throw Error('Draf tidak boleh tertanam pada HTML publik')}
// GitHub uploads replace files but can leave this obsolete, unprotected page.
// Only the authenticated server function should serve the current admin page.
await rm(path('public/kelola.html'),{force:true});
console.log('Praya siap: aset publik tersedia; admin menggunakan halaman server dengan login');
