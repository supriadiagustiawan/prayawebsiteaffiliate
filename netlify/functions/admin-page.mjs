import {getUser} from '@netlify/identity';
import html from '../lib/admin-template.mjs';
import {isAdminUser,privateHeaders} from '../lib/auth.mjs';
export default async()=>{
 try{
  const user=await getUser();
  if(!isAdminUser(user))return new Response(null,{status:303,headers:{...privateHeaders(),Location:'/login'}});
  return new Response(html,{headers:privateHeaders()});
 }catch{return new Response('Halaman admin belum tersedia. Periksa pengaturan Netlify Identity.',{status:503,headers:privateHeaders()})}
};
