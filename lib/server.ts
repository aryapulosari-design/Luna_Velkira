import 'server-only';
import {createClient, type Session} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import type {NextRequest} from 'next/server';
import type {Profile} from './domain';

export class ApiError extends Error {
 constructor(public status:number,public code:string,message:string,public fields?:Record<string,string>) {super(message);}
}
export const configured=()=>Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export function supabase(token?:string,secret=false) {
 if(!configured()) throw new ApiError(503,'SETUP_REQUIRED','Koneksi Supabase belum dikonfigurasi.');
 const key=secret?process.env.SUPABASE_SECRET_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!key) throw new ApiError(503,'SETUP_REQUIRED','Secret server untuk undangan belum dikonfigurasi.');
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:token?{Authorization:`Bearer ${token}`}:{}}});
}
export async function saveSession(session:Session|null) {
 const jar=await cookies();
 const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
 jar.set('luma-access',session?.access_token??'',{...options,maxAge:session?session.expires_in:0});
 jar.set('luma-refresh',session?.refresh_token??'',{...options,maxAge:session?60*60*24*7:0});
}
export async function authenticate() {
 const jar=await cookies();
 let token=jar.get('luma-access')?.value;
 let db=supabase(token);
 let user=token?(await db.auth.getUser(token)).data.user:null;
 if(!user) {
  const refresh=jar.get('luma-refresh')?.value;
  if(!refresh) throw new ApiError(401,'UNAUTHENTICATED','Sesi berakhir. Silakan masuk kembali.');
  const {data,error}=await db.auth.refreshSession({refresh_token:refresh});
  if(error||!data.session) {await saveSession(null);throw new ApiError(401,'UNAUTHENTICATED','Sesi berakhir. Silakan masuk kembali.');}
  await saveSession(data.session);token=data.session.access_token;user=data.user;db=supabase(token);
 }
 if(!user) throw new ApiError(401,'UNAUTHENTICATED','Silakan masuk kembali.');
 const {data:profile,error}=await db.from('profiles').select('id,display_name,role,is_active').eq('id',user.id).single();
 if(error||!profile?.is_active) throw new ApiError(403,'FORBIDDEN','Akun tidak aktif atau belum diundang ke workspace.');
 return {db,profile:profile as Profile,user,token:token!};
}
export function checkOrigin(req:NextRequest) {
 if(req.headers.get('origin')!==(process.env.APP_URL||req.nextUrl.origin)) throw new ApiError(403,'ORIGIN_REJECTED','Origin permintaan tidak diizinkan.');
}
export function databaseError(error:{code?:string;message:string}) : never {
 const messages:Record<string,[number,string]>={
  FORBIDDEN:[403,'Anda tidak memiliki izin untuk tindakan ini.'],NOT_FOUND:[404,'Data tidak ditemukan.'],
  VERSION_CONFLICT:[409,'Tiket telah diperbarui petugas lain. Muat ulang data; draft Anda tetap tersedia.'],
  ASSIGNMENT_CONFLICT:[409,'Tiket telah diambil petugas lain atau tidak dapat diambil.'],
  REQUEST_CONFLICT:[409,'ID permintaan sudah dipakai dengan isi berbeda.'],
  INVALID_TRANSITION:[422,'Perubahan status ini tidak diizinkan.'],INVALID_OWNER:[422,'Tiket memerlukan penanggung jawab aktif.'],
  INVALID_TIME:[422,'Waktu balasan harus setelah penerimaan dan tidak boleh di masa depan.'],
  LAST_ADMIN:[422,'Admin aktif terakhir tidak dapat dinonaktifkan atau diturunkan perannya.'],
  VALIDATION_ERROR:[422,'Periksa kembali isian Anda.'],
 };
 const known=messages[error.message];
 if(known) throw new ApiError(known[0],error.message,known[1]);
 if(error.code==='23505') throw new ApiError(409,'DUPLICATE','Data sudah tercatat. Cari dan gunakan catatan yang tersedia.');
 if(['23514','23502','23503','22P02','22007','22008'].includes(error.code??'')) throw new ApiError(422,'VALIDATION_ERROR','Isian tidak valid atau referensi tidak tersedia.');
 throw new ApiError(503,'DATABASE_UNAVAILABLE','Layanan database belum tersedia. Coba kembali.');
}
