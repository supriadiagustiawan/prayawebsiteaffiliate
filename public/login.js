'use strict';
const form=document.getElementById('login-form'),error=document.getElementById('login-error'),button=document.getElementById('login-submit');
const hash=new URLSearchParams(location.hash.slice(1));let action='login',token='';
for(const [key,type] of [['invite_token','invite'],['recovery_token','recovery'],['confirmation_token','confirmation']])if(hash.has(key)){action=type;token=hash.get(key);history.replaceState(null,'','/login');break}
if(action!=='login'){
 document.getElementById('email-label').hidden=true;form.email.required=false;
 document.getElementById('login-title').textContent=action==='invite'?'Buat kata sandi admin':action==='recovery'?'Atur ulang kata sandi':'Konfirmasi akun';
 document.getElementById('login-description').textContent='Gunakan tautan undangan atau pemulihan yang dikirim ke email Anda';
 form.password.autocomplete='new-password';form.password.minLength=12;button.textContent='Simpan dan masuk';
 if(action==='confirmation'){document.getElementById('password-label').hidden=true;form.password.required=false;button.textContent='Konfirmasi akun'}
}
form.onsubmit=async e=>{e.preventDefault();error.textContent='';button.disabled=true;try{
 const r=await fetch('/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:form.password.value,token})});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Belum dapat masuk');form.reset();location.replace('/admin');
 }catch(e){error.textContent=e.message||'Periksa koneksi lalu coba lagi'}finally{button.disabled=false}};
