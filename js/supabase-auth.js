/* FOCUS: account dropdown in toolbar + Supabase cloud sync */
(()=>{'use strict';
const URL='https://endleuygleytustpglud.supabase.co';
const KEY='sb_publishable_Mhvufh_MacGGgIfTuehhiw_lr095QhP';
if(!window.supabase||!window.supabase.createClient)return;
const db=window.supabase.createClient(URL,KEY);window.FOCUS_SUPABASE=db;
let user=null,syncing=false,syncTimer=null;
const $=s=>document.querySelector(s);
function mount(){
 const toolbar=$('.topbar .actions');if(!toolbar||$('#focus-cloud-auth'))return;
 const root=document.createElement('div');root.id='focus-cloud-auth';root.style.cssText='position:relative;display:inline-flex;align-items:center;z-index:20';
 root.innerHTML='<button class="iconbtn" id="fc-toggle" type="button" aria-expanded="false" title="ورود و ثبت‌نام">👤 حساب کاربری</button><div id="fc-panel" hidden style="position:absolute;top:calc(100% + 10px);left:0;width:min(330px,calc(100vw - 32px));padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:var(--shadow);display:none;gap:10px;flex-direction:column;text-align:right"><strong style="font-size:15px">حساب کاربری و همگام‌سازی</strong><div id="fc-status" class="muted" style="font-size:12px;overflow-wrap:anywhere">برای ذخیره ابری وارد شو.</div><label style="font-size:12px">ایمیل<input id="fc-email" type="email" placeholder="name@example.com" autocomplete="email" style="display:block;width:100%;margin-top:5px"></label><label style="font-size:12px">رمز عبور<input id="fc-pass" type="password" placeholder="حداقل ۶ نویسه" autocomplete="current-password" style="display:block;width:100%;margin-top:5px"></label><div id="fc-actions" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="fc-in" type="button">ورود</button><button class="btn primary" id="fc-up" type="button">ثبت‌نام</button><button class="btn" id="fc-out" type="button" hidden>خروج از حساب</button></div></div>';
 toolbar.append(root);
 const panel=$('#fc-panel'),status=$('#fc-status');
 $('#fc-toggle').onclick=()=>{const opening=panel.hidden;panel.hidden=!opening;panel.style.display=opening?'flex':'none';$('#fc-toggle').setAttribute('aria-expanded',String(opening))};
 document.addEventListener('click',e=>{if(!root.contains(e.target)){panel.hidden=true;panel.style.display='none';$('#fc-toggle').setAttribute('aria-expanded','false')}});
 function ui(){if(user){$('#fc-toggle').textContent='👤 '+(user.email||'حساب من');$('#fc-in').hidden=true;$('#fc-up').hidden=true;$('#fc-out').hidden=false;$('#fc-email').hidden=true;$('#fc-pass').hidden=true;status.textContent='وارد شده‌ای؛ همگام‌سازی ابری فعال می‌شود.'}else{$('#fc-toggle').textContent='👤 ورود / ثبت‌نام';$('#fc-in').hidden=false;$('#fc-up').hidden=false;$('#fc-out').hidden=true;$('#fc-email').hidden=false;$('#fc-pass').hidden=false;status.textContent='برای ذخیره و بازیابی اطلاعات روی دستگاه‌های مختلف وارد شو.'}}
 async function sync(restore=false){
  if(!user||syncing)return;syncing=true;
  try{
   if(restore){
    const {data:row,error}=await db.from('user_data').select('payload').eq('user_id',user.id).maybeSingle();if(error)throw error;
    if(row&&row.payload&&typeof row.payload==='object'){
     const local=JSON.parse(localStorage.getItem('focus_v1')||'{}');
     if(!local||Object.keys(local).length===0){localStorage.setItem('focus_v1',JSON.stringify(row.payload));status.textContent='اطلاعات ابری بازیابی شد ✓';return}
    }
   }
   const payload=JSON.parse(localStorage.getItem('focus_v1')||'{}');
   const {error}=await db.from('user_data').upsert({user_id:user.id,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;
   status.textContent='همگام‌سازی ابری فعال است ✓';
  }catch(e){status.textContent='خطای همگام‌سازی: '+(e.message||'اتصال برقرار نشد')}
  finally{syncing=false}
 }
 async function auth(mode){
  const email=$('#fc-email').value.trim(),password=$('#fc-pass').value;
  if(!email||password.length<6){status.textContent='ایمیل و رمز حداقل ۶ نویسه‌ای وارد کن.';return}
  status.textContent='در حال اتصال...';
  try{const r=mode==='up'?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
   if(r.error)throw r.error;user=r.data.user;ui();
   if(!r.data.session){status.textContent='ثبت‌نام انجام شد؛ اگر تأیید ایمیل فعال است، ایمیلت را بررسی کن و سپس وارد شو.';return}
   await sync(true);
  }catch(e){status.textContent='خطا: '+(e.message||'اتصال برقرار نشد')}
 }
 $('#fc-in').onclick=()=>auth('in');$('#fc-up').onclick=()=>auth('up');
 $('#fc-out').onclick=async()=>{await sync(false);const r=await db.auth.signOut();if(r.error){status.textContent='خطا هنگام خروج: '+r.error.message;return}user=null;ui();status.textContent='از حساب خارج شدی.'};
 db.auth.getSession().then(async r=>{if(r.error){status.textContent='خطای نشست: '+r.error.message;return}user=r.data.session?.user||null;ui();if(user)await sync(true)});
 const original=localStorage.setItem.bind(localStorage);
 localStorage.setItem=function(k,v){original(k,v);if(k==='focus_v1'&&user&&!syncing){clearTimeout(syncTimer);syncTimer=setTimeout(()=>sync(false),350)}};
}
function tryMount(){mount();if(!$('#focus-cloud-auth'))setTimeout(tryMount,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryMount);else tryMount();
})();