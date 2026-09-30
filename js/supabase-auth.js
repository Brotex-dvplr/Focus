/* FOCUS Supabase auth and cloud sync */
(()=>{'use strict';
const URL='https://endleuygleytustpglud.supabase.co';
const KEY='sb_publishable_Mhvufh_MacGGgIfTuehhiw_lr095QhP';
if(!window.supabase||!window.supabase.createClient)return;
const db=window.supabase.createClient(URL,KEY);
window.FOCUS_SUPABASE=db;
let user=null, syncing=false, syncTimer=null;
const $=s=>document.querySelector(s);
function mount(){
 const h=$('.topbar .actions');
 if(!h||$('#focus-cloud-auth'))return;
 const box=document.createElement('section');box.id='focus-cloud-auth';
 box.style.cssText='display:flex;gap:6px;flex-wrap:wrap;align-items:center';
 box.innerHTML='<button class="btn" id="fc-toggle" type="button">☁️ حساب ابری</button><span id="fc-status" class="muted">ورود برای همگام‌سازی</span><div id="fc-form" hidden style="width:100%;display:flex;gap:5px;flex-wrap:wrap"><input id="fc-email" type="email" placeholder="ایمیل" autocomplete="email"><input id="fc-pass" type="password" placeholder="رمز عبور" autocomplete="current-password"><button class="btn" id="fc-in" type="button">ورود</button><button class="btn primary" id="fc-up" type="button">ثبت‌نام</button><button class="btn" id="fc-out" type="button" hidden>خروج</button></div>';
 h.append(box);
 const status=$('#fc-status'),form=$('#fc-form');
 $('#fc-toggle').onclick=()=>{form.hidden=!form.hidden;form.style.display=form.hidden?'none':'flex'};
 function ui(){if(user){status.textContent='حساب: '+user.email;$('#fc-in').hidden=true;$('#fc-up').hidden=true;$('#fc-out').hidden=false}else{status.textContent='ورود برای همگام‌سازی';$('#fc-in').hidden=false;$('#fc-up').hidden=false;$('#fc-out').hidden=true}}
 async function sync(restore=false){
  if(!user||syncing)return;
  syncing=true;
  try{
   if(restore){
    const {data:row,error}=await db.from('user_data').select('payload').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    if(row&&row.payload&&typeof row.payload==='object'){
     const local=JSON.parse(localStorage.getItem('focus_v1')||'{}');
     const hasLocal=local&&Object.keys(local).length>0;
     if(!hasLocal){localStorage.setItem('focus_v1',JSON.stringify(row.payload));status.textContent='اطلاعات ابری بازیابی شد.';return}
    }
   }
   const payload=JSON.parse(localStorage.getItem('focus_v1')||'{}');
   const {error}=await db.from('user_data').upsert({user_id:user.id,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   if(error)throw error;
   status.textContent='همگام‌سازی ابری فعال است ✓';
  }catch(e){status.textContent='خطای همگام‌سازی: '+(e.message||'اتصال برقرار نشد')}
  finally{syncing=false}
 }
 async function auth(mode){
  const email=$('#fc-email').value.trim(),password=$('#fc-pass').value;
  if(!email||password.length<6){status.textContent='ایمیل و رمز حداقل ۶ نویسه‌ای وارد کن.';return}
  status.textContent='در حال اتصال...';
  const r=mode==='up'?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
  if(r.error){status.textContent='خطا: '+r.error.message;return}
  user=r.data.user;ui();
  if(!r.data.session){status.textContent='ثبت‌نام انجام شد؛ اگر تأیید ایمیل فعال است، ایمیلت را بررسی کن و سپس وارد شو.';return}
  await sync(true);
 }
 $('#fc-in').onclick=()=>auth('in');
 $('#fc-up').onclick=()=>auth('up');
 $('#fc-out').onclick=async()=>{await sync(false);const r=await db.auth.signOut();if(r.error){status.textContent='خطا هنگام خروج: '+r.error.message;return}user=null;ui();status.textContent='از حساب خارج شدی.'};
 db.auth.getSession().then(async r=>{if(r.error){status.textContent='خطای نشست: '+r.error.message;return}user=r.data.session?.user||null;ui();if(user)await sync(true)});
 const original=localStorage.setItem.bind(localStorage);
 localStorage.setItem=function(k,v){original(k,v);if(k==='focus_v1'&&user&&!syncing){clearTimeout(syncTimer);syncTimer=setTimeout(()=>sync(false),350)}};
}
function tryMount(){mount();if(!$('#focus-cloud-auth'))setTimeout(tryMount,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryMount);else tryMount();
})();