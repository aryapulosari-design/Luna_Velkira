'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/client';
import Icon from './icons';
export default function Login({configured}:{configured:boolean}) {
 const [mode,setMode]=useState<'login'|'recover'|'password'>('login');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{
  const url=new URL(location.href),token=url.searchParams.get('token_hash'),type=url.searchParams.get('type');
  if(token&&(type==='invite'||type==='recovery')) {
   history.replaceState(null,'','/login');setBusy(true);
   api('/api/auth/verify',{token_hash:token,type}).then(()=>setMode('password')).catch(e=>setError(e.message)).finally(()=>setBusy(false));
  }
 },[]);
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();setBusy(true);setError('');setMessage('');
  const data=Object.fromEntries(new FormData(event.currentTarget));
  try {
   await api(`/api/auth/${mode}`,mode==='recover'?{email:data.email}:mode==='password'?{password:data.password}:data);
   if(mode==='recover') setMessage('Jika akun terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk Anda.');
   else location.assign('/');
  }catch(e){setError(e instanceof Error?e.message:'Tidak dapat masuk.');}finally{setBusy(false);}
 }
 return <div className="login-page"><section className="login-story"><a href="/" className="brand"><span className="brand-symbol">l</span><span>luma<span className="brand-light">support</span></span></a><div><span className="eyebrow">RUANG KERJA LAYANAN PELANGGAN</span><h1>Setiap percakapan,<br/>ditangani dengan baik.</h1><p>Satukan permintaan pelanggan, beri tanggung jawab yang jelas, dan jaga setiap tindak lanjut tetap terlacak.</p><div className="story-steps"><span><Icon name="tickets"/> Satu antrean bersama</span><span><Icon name="customers"/> Tim yang terhubung</span><span><Icon name="shield"/> Riwayat yang terjaga</span></div></div><small>VELKIRA · Luma Support</small></section><main className="login-form"><div className="login-box"><span className="overline">SELAMAT DATANG DI LUMA</span><h2>{mode==='recover'?'Pulihkan akun':mode==='password'?'Atur kata sandi':'Masuk ke workspace'}</h2><p>{mode==='login'?'Gunakan akun yang telah diundang oleh admin toko.':mode==='recover'?'Kami akan mengirim tautan ke email akun Anda.':'Gunakan minimal 12 karakter untuk melindungi akun Anda.'}</p>{!configured&&<div className="notice"><Icon name="alert"/><div><strong>Koneksi database belum disiapkan</strong><p>Lengkapi environment Supabase dan jalankan migrasi sesuai README untuk mengaktifkan login.</p><a href="/">Lihat panduan setup</a></div></div>}<form onSubmit={submit}>{mode!=='password'&&<label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@toko.com" required/></label>}{mode!=='recover'&&<label>Kata sandi<input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='password'?12:1} maxLength={256} placeholder="Masukkan kata sandi" required/></label>}{error&&<div className="form-error" role="alert">{error}</div>}{message&&<div className="form-success" role="status">{message}</div>}<button className="primary full" disabled={busy||!configured}>{busy?'Memproses…':mode==='login'?'Masuk ke workspace':mode==='recover'?'Kirim tautan pemulihan':'Simpan kata sandi'}<Icon name="arrow" size={18}/></button></form>{mode!=='password'&&<button className="text-button" onClick={()=>{setMode(mode==='login'?'recover':'login');setError('');setMessage('');}}>{mode==='login'?'Lupa kata sandi?':'Kembali ke halaman masuk'}</button>}<div className="login-foot"><Icon name="shield" size={15}/> Workspace privat · Akses khusus tim toko</div></div></main></div>;
}
