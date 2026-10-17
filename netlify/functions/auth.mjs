import {login,logout,getUser,acceptInvite,recoverPassword,confirmEmail,verifyRequestOrigin} from '@netlify/identity';
import {isAdminUser,privateHeaders} from '../lib/auth.mjs';
import {authAction} from '../lib/auth-route.mjs';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:privateHeaders('application/json')});
export default async request=>{
 try {
  const action=authAction(request.url);
  if(action==='session'&&request.method==='GET'){
   const user=await getUser();return reply({authenticated:!!user,admin:isAdminUser(user)});
  }
  if(request.method!=='POST')return reply({error:'Metode tidak diizinkan'},405);
  verifyRequestOrigin(request);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Gunakan JSON'},415);
  const raw=await request.text();if(raw.length>8192)return reply({error:'Data terlalu besar'},413);
  const body=JSON.parse(raw);
  if(action==='logout'){await logout();return reply({ok:true})}
  let user;
  if(action==='login')user=await login(String(body.email||''),String(body.password||''));
  else if(action==='invite')user=await acceptInvite(String(body.token||''),String(body.password||''));
  else if(action==='recovery')user=await recoverPassword(String(body.token||''),String(body.password||''));
  else if(action==='confirmation')user=await confirmEmail(String(body.token||''));
  else return reply({error:'Endpoint tidak tersedia'},404);
  if(!isAdminUser(user)){await logout();return reply({error:'Akun ini belum mendapat akses admin. Hubungi pemilik website'},403)}
  return reply({ok:true});
 }catch(e){return reply({error:e.status===403?'Permintaan tidak diizinkan':'Belum bisa masuk. Periksa akun atau tautan undangan dan pengaturan Netlify Identity'},e.status===403?403:401)}
};
