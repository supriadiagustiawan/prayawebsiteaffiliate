import {createHash} from 'node:crypto';
import {Problem,shopURL,validateCatalog,applyMetadata,lookup} from './core.mjs';
const headers=['kode','link_affiliate','status','kategori','nama','toko','foto','harga','rating','tanggal_cek','unggulan','acara','harga_awal','sumber_promo','cek_promo','promo_berakhir','sisa_stok'];
export {headers as sheetHeaders};
export function sheetConfig(raw){
 let u;try{u=new URL(raw.url)}catch{throw new Problem('Masukkan link Google Sheets yang valid')}
 const id=u.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1];
 if(u.protocol!=='https:'||u.hostname!=='docs.google.com'||u.username||u.password||!id)throw new Problem('Gunakan link docs.google.com/spreadsheets/d/...');
 const mode=raw.mode==='public'?'public':'private',tab=String(raw.tab||'Produk').trim();
 if(!tab||tab.length>80||/[\[\]*?:/\\]/.test(tab))throw new Problem('Nama tab spreadsheet tidak valid');
 return {url:`https://docs.google.com/spreadsheets/d/${id}/edit`,id,mode,tab};
}
export function parseCSV(text){
 if(text.length>2_000_000)throw new Problem('Spreadsheet terlalu besar');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else if(!field||quoted)quoted=!quoted;else throw new Problem('Format CSV tidak valid')}
 else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field=''}else field+=c}
 if(quoted)throw new Problem('Tanda kutip CSV belum ditutup');if(field||row.length){row.push(field);rows.push(row)}return rows;
}
export async function readSheet(config,{env=process.env,fetcher=fetch}={}){
 const c=sheetConfig(config),signal=AbortSignal.timeout(12000);let rows;
 if(c.mode==='private'){
  if(!env.GOOGLE_SERVICE_ACCOUNT_EMAIL||!env.GOOGLE_PRIVATE_KEY)throw new Problem('Akses Google Sheets privat belum disetel di Netlify',503);
  const {JWT}=await import('google-auth-library');
  const auth=new JWT({email:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,key:env.GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n'),scopes:['https://www.googleapis.com/auth/spreadsheets.readonly']});
  const token=await auth.getAccessToken();
  const range=`'${c.tab.replace(/'/g,"''")}'!A1:Q1002`;
  const r=await fetcher(`https://sheets.googleapis.com/v4/spreadsheets/${c.id}/values/${encodeURIComponent(range)}`,{headers:{Authorization:`Bearer ${token.token}`},signal,redirect:'error'});
  if(!r.ok)throw new Problem('Spreadsheet tidak terbaca. Periksa nama tab dan akses Viewer service account',502);
  rows=(await r.json()).values||[];
 }else{
  // The public option is explicitly selected by the owner. Never follows arbitrary URLs.
  const r=await fetcher(`https://docs.google.com/spreadsheets/d/${c.id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(c.tab)}`,{signal,redirect:'error'});
  if(!r.ok||!(r.headers.get('content-type')||'').match(/csv|plain/))throw new Problem('Tab publik belum terbaca. Periksa izin Viewer dan nama tab',502);
  rows=parseCSV(await r.text());
 }
 if(!Array.isArray(rows)||rows.length>1001)throw new Problem('Maksimal 1.000 produk per spreadsheet');return rows;
}
export async function catalogFromRows(rows,current,{env={},fetcher=fetch,deadline=Date.now()+17000}={}){
 if(rows.length<2)throw new Problem('Spreadsheet kosong. Katalog lama tetap dipakai');
 const head=rows[0].map(x=>String(x).replace(/^\uFEFF/,'').trim().toLowerCase());
 if(!head.includes('link_affiliate')||new Set(head.filter(Boolean)).size!==head.filter(Boolean).length)throw new Problem('Kolom link_affiliate wajib ada dan judul kolom harus unik');
 const products=[],issues=[],codes=new Set(),links=new Set();let enriched=0;
 for(let i=1;i<rows.length;i++){
  if(!rows[i].some(x=>String(x).trim()))continue;
  const row=Object.fromEntries(head.map((h,j)=>[h,String(rows[i][j]??'').trim()])),url=row.link_affiliate;
  if(!shopURL(url))throw new Problem(`Baris ${i+1}: link affiliate bukan link Shopee HTTPS`);
  const id=(row.kode||'P-'+createHash('sha256').update(url).digest('hex').slice(0,10)).toUpperCase();
  if(!/^[A-Z0-9-]{1,14}$/.test(id)||codes.has(id)||links.has(url))throw new Problem(`Baris ${i+1}: kode atau link duplikat / tidak valid`);codes.add(id);links.add(url);
  const old=current.products.find(p=>p.id===id&&p.url===url)||current.products.find(p=>p.url===url);
  const statuses={aktif:'active',sembunyi:'hidden',habis:'soldout',hapus:'deleted',active:'active',hidden:'hidden',soldout:'soldout',deleted:'deleted'};
  const status=statuses[row.status||'aktif'];if(!status)throw new Problem(`Baris ${i+1}: status tidak dikenal`);
  const num=(key,max=Infinity)=>{if(!row[key])return null;const n=Number(row[key]);if(!Number.isFinite(n)||n<0||n>max)throw new Problem(`Baris ${i+1}: ${key} harus angka valid tanpa Rp atau pemisah ribuan`);return n};
  let p={...(old||{}),id,url,affiliate:true,category:row.kategori||old?.category||'Lainnya',name:row.nama||old?.name||'Menunggu data produk',brand:row.toko||old?.brand||'Belum tersedia',image:row.foto||old?.image||'',price:row.harga?num('harga'):old?.price??null,rating:row.rating?num('rating',5):old?.rating??null,ratingSource:row.rating?url:old?.ratingSource||'',verifiedAt:row.tanggal_cek||old?.verifiedAt||'',status,featured:['ya','true','1'].includes(row.unggulan?.toLowerCase()),occasions:(row.acara||'').split(',').map(s=>s.trim()).filter(Boolean),note:'',dataSource:row.harga||row.rating||row.foto?'manual':old?.dataSource||'manual',originalPrice:num('harga_awal'),offerSource:row.sumber_promo||'',offerCheckedAt:row.cek_promo||'',promoEndsAt:row.promo_berakhir||'',stockRemaining:num('sisa_stok')};
  if(p.rating!==null&&!Number.isFinite(Date.parse(p.verifiedAt)))throw new Problem(`Baris ${i+1}: rating memerlukan tanggal_cek`);
  if(p.stockRemaining!==null&&!Number.isInteger(p.stockRemaining))throw new Problem(`Baris ${i+1}: sisa_stok harus bilangan bulat`);
  products.push(p);
 }
 if(!products.length)throw new Problem('Spreadsheet kosong. Gunakan status hapus untuk mengosongkan katalog');
 // Enrich a rotating slice: existing products with oldest verification first, new rows first.
 const candidates=products.filter(p=>p.status!=='deleted').sort((a,b)=>(Date.parse(a.verifiedAt)||0)-(Date.parse(b.verifiedAt)||0));
 if(env.SHOPEE_APP_ID&&env.SHOPEE_APP_SECRET)for(let i=0;i<candidates.length&&Date.now()<deadline-2000;i+=3){
  await Promise.all(candidates.slice(i,i+3).map(async p=>{try{const m=await lookup(p.url,{env,fetcher,timeout:Math.min(5000,deadline-Date.now())});Object.assign(p,applyMetadata(p,m));enriched++}catch{issues.push({code:p.id,message:'Data Shopee belum tersedia; data terakhir dipertahankan'})}}));
 }
 for(const p of products){if(p.name==='Menunggu data produk'||p.brand==='Belum tersedia'||!p.image){if(p.status==='active')p.status='hidden';issues.push({code:p.id,message:'Lengkapi nama, toko, dan foto atau aktifkan sumber data Shopee'})}}
 const catalog=validateCatalog({...current,products});return {catalog,report:{total:products.length,published:catalog.products.filter(p=>p.status==='active'||p.status==='soldout').length,enriched,issues:issues.slice(0,100)}};
}
