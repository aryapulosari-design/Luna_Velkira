import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {ApiError,checkOrigin,saveSession,supabase,authenticate} from '@/lib/server';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}) {
 try {
  checkOrigin(req);
  const {action}=await params;
  if(action==='logout') {await saveSession(null);return NextResponse.json({data:true});}
  const raw=await req.text();
  if(raw.length>8192) throw new ApiError(413,'PAYLOAD_TOO_LARGE','Isian terlalu panjang.');
  let body:unknown;try {body=JSON.parse(raw);}catch{throw new ApiError(400,'INVALID_JSON','Format permintaan tidak valid.');}
  const db=supabase();
  if(action==='login') {
   const input=z.strictObject({email:z.email(),password:z.string().min(1).max(256)}).parse(body);
   const {data,error}=await db.auth.signInWithPassword(input);
   if(error||!data.session) throw new ApiError(error?.status===429?429:401,'LOGIN_FAILED','Tidak dapat masuk. Periksa akun undangan dan kata sandi Anda.');
   await saveSession(data.session);
   try {await authenticate();}catch(error){await saveSession(null);throw error;}
  } else if(action==='recover') {
   const {email}=z.strictObject({email:z.email()}).parse(body);
   const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:`${process.env.APP_URL||req.nextUrl.origin}/login?recovery=1`});
   if(error) throw new ApiError(error.status===429?429:503,'RECOVERY_FAILED','Pemulihan belum tersedia. Coba lagi nanti.');
  } else if(action==='password') {
   const {password}=z.strictObject({password:z.string().min(12).max(256)}).parse(body);
   const {db:sessionDb,token}=await authenticate();
   await sessionDb.auth.setSession({access_token:token,refresh_token:(await cookies()).get('luma-refresh')!.value});
   const {error}=await sessionDb.auth.updateUser({password});
   if(error) throw new ApiError(422,'PASSWORD_FAILED','Kata sandi belum dapat diperbarui. Gunakan tautan pemulihan baru.');
  } else if(action==='verify') {
   const {token_hash,type}=z.strictObject({token_hash:z.string().min(1).max(2048),type:z.enum(['invite','recovery'])}).parse(body);
   const {data,error}=await db.auth.verifyOtp({token_hash,type});
   if(error||!data.session) throw new ApiError(401,'INVALID_LINK','Tautan tidak valid atau sudah kedaluwarsa.');
   await saveSession(data.session);
  } else throw new ApiError(404,'NOT_FOUND','Endpoint tidak ditemukan.');
  return NextResponse.json({data:true},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error) {
  const e=error instanceof ApiError?error:new ApiError(error instanceof z.ZodError?422:503,'AUTH_ERROR',error instanceof z.ZodError?'Periksa isian email dan kata sandi.':'Layanan login tidak tersedia.');
  return NextResponse.json({error:{code:e.code,message:e.message}},{status:e.status,headers:{'Cache-Control':'private, no-store'}});
 }
}
