import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {ApiError,authenticate,checkOrigin,databaseError,supabase} from '@/lib/server';
import {schemas,listQuery,type Action} from '@/lib/validation';

export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const uuid=z.uuid();
const headers={'Cache-Control':'private, no-store'};
const ok=(data:unknown,status=200,meta?:unknown)=>NextResponse.json({data,...(meta?{meta}:{})},{status,headers});
const ticketSelect='*,number::text,customers(id,name,contact_reference,created_at)';
const numeric=(row:Record<string,unknown>)=>({...row,...('number' in row?{number:String(row.number)}:{}),...('event_type' in row?{id:String(row.id)}:{})});

async function handle(req:NextRequest,context:Context) {
 const trace=crypto.randomUUID();
 try {
  if(req.method!=='GET') checkOrigin(req);
  const {db,profile}=await authenticate();
  const {data:allowed,error:rateError}=await db.rpc('luma_rate_limit');
  if(rateError) databaseError(rateError);
  if(!allowed) throw new ApiError(429,'RATE_LIMIT','Terlalu banyak permintaan. Coba dalam satu menit.');
  const {path}=await context.params;
  const [resource,id,operation]=path;
  if(path.length>3) throw new ApiError(404,'NOT_FOUND','Endpoint tidak ditemukan.');
  const qs=Object.fromEntries(req.nextUrl.searchParams);
  if(req.method==='GET') {
   if(resource==='me'&&!id) return ok(profile);
   if(resource==='metrics'&&!id) {
    const {days}=z.strictObject({days:z.coerce.number().refine(n=>n===7||n===30).default(7)}).parse(qs);
    const {data,error}=await db.rpc('luma_metrics',{days});if(error) databaseError(error);return ok(data);
   }
   if(resource==='requests'&&id&&!operation) {
    uuid.parse(id);const {data,error}=await db.from('mutation_requests').select('result').eq('actor_id',profile.id).eq('request_id',id).maybeSingle();
    if(error) databaseError(error);return ok(data?.result??null);
   }
   if(resource==='tickets'&&id&&!operation) {
    uuid.parse(id);
    const page=z.strictObject({notes_cursor:uuid.optional(),events_cursor:z.string().regex(/^\d{1,19}$/).optional()}).parse(qs);
    const {data:ticket,error}=await db.from('tickets').select(ticketSelect).eq('id',id).maybeSingle();if(error) databaseError(error);
    if(!ticket) throw new ApiError(404,'NOT_FOUND','Tiket tidak ditemukan.');
    let notesQuery=db.from('ticket_notes').select('*').eq('ticket_id',id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(26);
    let eventsQuery=db.from('ticket_events').select('id::text,ticket_id,actor_id,event_type,details,created_at').eq('ticket_id',id).order('id',{ascending:false}).limit(26);
    if(page.notes_cursor) {
     const {data:anchor,error}=await db.from('ticket_notes').select('created_at').eq('ticket_id',id).eq('id',page.notes_cursor).maybeSingle();
     if(error) databaseError(error);if(!anchor) throw new ApiError(422,'INVALID_CURSOR','Halaman catatan tidak valid.');
     notesQuery=notesQuery.or(`created_at.lt.${anchor.created_at},and(created_at.eq.${anchor.created_at},id.lt.${page.notes_cursor})`);
    }
    if(page.events_cursor) eventsQuery=eventsQuery.lt('id',page.events_cursor);
    const [notes,events]=await Promise.all([notesQuery,eventsQuery]);if(notes.error) databaseError(notes.error);if(events.error) databaseError(events.error);
    return ok({...numeric(ticket),notes:notes.data.slice(0,25),events:events.data.slice(0,25).map(numeric)},200,{
     notes_cursor:notes.data.length>25?notes.data[24].id:null,events_cursor:events.data.length>25?String(events.data[24].id):null,
    });
   }
   if(resource==='tickets'&&!id) {
    const input=listQuery.parse(qs);
    let query=db.from('tickets').select(ticketSelect).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(input.limit+1);
    if(input.cursor) {
     const {data:anchor,error}=await db.from('tickets').select('created_at').eq('id',input.cursor).maybeSingle();
     if(error) databaseError(error);if(!anchor) throw new ApiError(422,'INVALID_CURSOR','Halaman tiket tidak valid.');
     query=query.or(`created_at.lt.${anchor.created_at},and(created_at.eq.${anchor.created_at},id.lt.${input.cursor})`);
    }
    if(input.status) query=query.eq('status',input.status);
    if(input.priority) query=query.eq('priority',input.priority);
    if(input.customer) query=query.eq('customer_id',input.customer);
    if(input.order) query=query.eq('order_reference',input.order);
    if(input.owner==='unassigned') query=query.is('assigned_to',null);
    else if(input.owner) query=query.eq('assigned_to',input.owner==='me'?profile.id:input.owner);
    if(input.q) {
     // Keep PostgREST filter syntax out of user-provided search terms.
     const term=input.q.replace(/[^\p{L}\p{N}\s@._-]/gu,'').trim();
     if(term) query=query.or(`subject.ilike.%${term}%,order_reference.ilike.%${term}%`);
    }
    const {data,error}=await query;if(error) databaseError(error);
    return ok(data.slice(0,input.limit).map(numeric),200,{next_cursor:data.length>input.limit?data[input.limit-1].id:null});
   }
   if(['customers','faqs','team'].includes(resource)&&!id) {
    const input=z.strictObject({q:z.string().trim().max(160).default(''),cursor:uuid.optional(),limit:z.coerce.number().int().min(1).max(100).default(25)}).parse(qs);
    const table=resource==='team'?'profiles':resource;
    let query=db.from(table).select('*').order('id',{ascending:false}).limit(input.limit+1);
    if(input.cursor) query=query.lt('id',input.cursor);
    if(input.q) query=query.ilike(resource==='customers'?'name':resource==='faqs'?'question':'display_name',`%${input.q.replace(/[%_]/g,'')}%`);
    const {data,error}=await query;if(error) databaseError(error);
    return ok(data.slice(0,input.limit),200,{next_cursor:data.length>input.limit?data[input.limit-1].id:null});
   }
   throw new ApiError(404,'NOT_FOUND','Endpoint tidak ditemukan.');
  }
  const raw=await req.text();
  if(raw.length>20000) throw new ApiError(413,'PAYLOAD_TOO_LARGE','Isian terlalu panjang.');
  let body:unknown;try{body=JSON.parse(raw);}catch{throw new ApiError(400,'INVALID_JSON','JSON tidak valid.');}
  if(resource==='team'&&id==='invitations'&&!operation&&req.method==='POST') {
   if(profile.role!=='admin') throw new ApiError(403,'FORBIDDEN','Hanya admin dapat mengundang petugas.');
   const input=z.strictObject({email:z.email(),display_name:z.string().trim().min(1).max(160)}).parse(body);
   const {data,error}=await supabase(undefined,true).auth.admin.inviteUserByEmail(input.email,{data:{display_name:input.display_name},redirectTo:`${process.env.APP_URL||req.nextUrl.origin}/login?invitation=1`});
   if(error) throw new ApiError(503,'INVITATION_FAILED','Undangan belum terkirim. Periksa konfigurasi SMTP atau akun yang sudah ada.');
   return ok({id:data.user.id},201);
  }
  let action:Action|undefined;
  if(req.method==='POST'&&!id) action=resource==='tickets'?'ticket.create':resource==='customers'?'customer.create':resource==='faqs'?'faq.save':undefined;
  if(id&&req.method==='PUT'&&!operation) action=resource==='tickets'?'ticket.update':resource==='faqs'?'faq.save':resource==='team'?'team.update':undefined;
  if(resource==='tickets'&&id&&req.method==='POST') {
   const operations:Record<string,Action>={claim:'ticket.claim',assign:'ticket.assign',notes:'ticket.note',responses:'ticket.response',status:'ticket.status',faqs:'ticket.faq'};
   action=operations[operation];
  }
  if(!action) throw new ApiError(404,'NOT_FOUND','Endpoint tidak ditemukan.');
  if(id) uuid.parse(id);
  const input=schemas[action].parse(body);
  const {data,error}=await db.rpc('luma_mutate',{action,payload:{...input,...(id?{id}:{})}});
  if(error) databaseError(error);
  return ok(data,action.endsWith('.create')||action.endsWith('.note')||action.endsWith('.response')?201:200);
 }catch(error) {
  const fields=error instanceof z.ZodError?Object.fromEntries(error.issues.map(i=>[i.path.join('.'),i.message])):undefined;
  const e=error instanceof ApiError?error:new ApiError(error instanceof z.ZodError?422:500,error instanceof z.ZodError?'VALIDATION_ERROR':'INTERNAL_ERROR',error instanceof z.ZodError?'Periksa kembali isian Anda.':'Permintaan belum dapat diproses. Coba kembali.',fields);
  return NextResponse.json({error:{code:e.code,message:e.message,fields:e.fields,request_id:trace}},{status:e.status,headers});
 }
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
