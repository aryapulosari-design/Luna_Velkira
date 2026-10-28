import {z} from 'zod';
import {RequestError,type Result} from './client.ts';
import {transitions,type Customer,type Faq,type Metrics,type Note,type Profile,type Ticket,type TicketEvent} from './domain.ts';
import {schemas,type Action} from './validation.ts';

type DemoTicket=Ticket&{notes:Note[];events:TicketEvent[];first_response_at:string|null};
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

// shortcut: demo lives only in this page's memory; use Supabase for persistent, shared work.
export function createDemoClient(now=Date.now()) {
 const ago=(minutes:number)=>new Date(now-minutes*60000).toISOString();
 const members:Profile[]=[
  {id:id(1),display_name:'Nadia Putri',role:'admin',is_active:true},
  {id:id(2),display_name:'Raka Pratama',role:'agent',is_active:true},
  {id:id(3),display_name:'Dinda Safitri',role:'agent',is_active:true},
 ];
 const actor=members[0];
 const customers:Customer[]=['Alya Maharani','Bima Saputra','Citra Lestari','Dimas Nugraha','Eva Andini','Farhan Akbar','Gita Permata','Hana Wijaya'].map((name,i)=>({id:id(101+i),name,contact_reference:`pelanggan${i+1}@example.invalid`,created_at:ago(1440*(i+1))}));
 const faqs:Faq[]=[
  {id:id(401),question:'Bagaimana jika pesanan melewati estimasi pengiriman?',answer:'Kebijakan contoh: periksa nomor resi di kanal ekspedisi resmi. Catat hasil pemeriksaan dan sampaikan perkembangan kepada pelanggan. Eskalasikan jika status tidak berubah; jangan menjanjikan tanggal tiba yang belum dikonfirmasi.',is_published:true,updated_at:ago(1440)},
  {id:id(402),question:'Apa syarat pengajuan retur barang?',answer:'Kebijakan contoh demo: minta nomor pesanan, foto kondisi barang, dan uraian kendala. Admin meninjau pengajuan sebelum memberi persetujuan atau instruksi pengiriman kembali.',is_published:true,updated_at:ago(2880)},
  {id:id(403),question:'Pembayaran berhasil, tetapi status pesanan belum berubah?',answer:'Kebijakan contoh: cocokkan nomor pesanan dan referensi transaksi pada sistem toko. Jangan meminta PIN, OTP, atau nomor kartu lengkap. Eskalasikan ke admin jika pencocokan belum berhasil.',is_published:true,updated_at:ago(720)},
  {id:id(404),question:'Bisakah alamat pengiriman diubah?',answer:'Kebijakan contoh: periksa apakah pesanan sudah diproses atau diserahkan kepada ekspedisi. Perubahan alamat membutuhkan konfirmasi petugas melalui kanal asal. Jangan menjanjikan perubahan sebelum dikonfirmasi.',is_published:true,updated_at:ago(360)},
  {id:id(405),question:'Panduan kompensasi pelanggan — draft',answer:'Contoh draft internal. Nilai dan jenis kompensasi harus disetujui pemilik toko sebelum kebijakan ini diterbitkan.',is_published:false,updated_at:ago(180)},
 ];
 const specs:{subject:string;summary:string;status:Ticket['status'];category:Ticket['category'];channel:Ticket['channel'];owner:number|null;high?:boolean}[]=[
  {subject:'Pesanan belum sampai melewati estimasi',summary:'Pelanggan menanyakan pesanan yang melewati estimasi dua hari. Nomor resi sudah tersedia dan perlu ditinjau petugas.',status:'new',category:'shipping',channel:'whatsapp',owner:null,high:true},
  {subject:'Ukuran kemeja yang diterima tidak sesuai',summary:'Pelanggan memesan ukuran L tetapi menerima ukuran M. Foto label barang sudah diterima melalui WhatsApp.',status:'in_progress',category:'return',channel:'whatsapp',owner:1,high:true},
  {subject:'Menunggu foto kondisi kemasan rusak',summary:'Kemasan penyok saat diterima. Petugas meminta foto barang dan kemasan untuk peninjauan lebih lanjut.',status:'waiting_customer',category:'product',channel:'marketplace',owner:2},
  {subject:'Pembayaran belum terverifikasi',summary:'Pelanggan melaporkan pembayaran berhasil, tetapi status pesanan belum berubah. Perlu pencocokan referensi transaksi oleh admin.',status:'escalated',category:'payment',channel:'email',owner:1,high:true},
  {subject:'Perubahan alamat sebelum pesanan diproses',summary:'Pelanggan meminta koreksi nomor rumah. Tim sedang memeriksa apakah paket sudah masuk proses pengemasan.',status:'in_progress',category:'shipping',channel:'phone',owner:3},
  {subject:'Pertanyaan bahan dan panduan perawatan',summary:'Pelanggan meminta informasi bahan serta cara mencuci produk. Informasi produk sudah disampaikan dan diterima pelanggan.',status:'resolved',category:'product',channel:'marketplace',owner:2},
  {subject:'Pengajuan retur warna barang berbeda',summary:'Warna barang yang diterima berbeda dari pesanan. Menunggu foto produk untuk diverifikasi terhadap rincian pesanan.',status:'waiting_customer',category:'return',channel:'whatsapp',owner:3},
  {subject:'Minta pembaruan nomor resi pengiriman',summary:'Pelanggan belum menemukan nomor resi pada pesanan. Petugas perlu memeriksa informasi pengiriman di sistem toko.',status:'new',category:'shipping',channel:'marketplace',owner:null},
  {subject:'Permintaan salinan invoice pembelian',summary:'Pelanggan membutuhkan salinan invoice. Dokumen sudah diberikan melalui kanal asal dan penerimaan telah dikonfirmasi.',status:'resolved',category:'general',channel:'email',owner:1},
  {subject:'Satu item belum ada di dalam paket',summary:'Pelanggan melaporkan satu item belum diterima. Tim memeriksa catatan pengemasan dan meminta foto isi paket.',status:'in_progress',category:'product',channel:'whatsapp',owner:1,high:true},
  {subject:'Konfirmasi metode pembayaran tersedia',summary:'Pelanggan meminta penjelasan metode pembayaran. Petugas telah mengarahkan ke pilihan yang tersedia di checkout toko.',status:'resolved',category:'payment',channel:'phone',owner:3},
  {subject:'Tanya ketersediaan pilihan warna produk',summary:'Pelanggan menanyakan pilihan warna sebelum memesan. Ketersediaan perlu diperiksa pada sistem toko.',status:'new',category:'product',channel:'whatsapp',owner:null},
 ];
 const tickets:DemoTicket[]=specs.map((s,i)=>{
  const customer=customers[i%customers.length],created=ago(20+i*110),assigned=s.owner?id(s.owner):null;
  const events:TicketEvent[]=[{id:String(1000+i*10),actor_id:actor.id,event_type:'created',details:{},created_at:created}];
  const notes:Note[]=[];
  if(assigned){events.unshift({id:String(1001+i*10),actor_id:assigned,event_type:'ticket.claim',details:{status:s.status},created_at:ago(10+i*110)});notes.push({id:id(301+i),author_id:assigned,body:s.status==='resolved'?'Pelanggan telah menerima informasi yang dibutuhkan dan mengonfirmasi penyelesaian.':'Permintaan sudah ditinjau. Tindak lanjut dilakukan melalui kanal asal sesuai kebijakan contoh toko.',kind:s.status==='resolved'?'resolution':'internal',sent_at:null,created_at:ago(5+i*110)});}
  return {id:id(201+i),number:String(1042+i),customer_id:customer.id,customers:customer,subject:s.subject,summary:s.summary,status:s.status,category:s.category,channel:s.channel,priority:s.high?'high':'normal',assigned_to:assigned,created_by:actor.id,version:assigned?2:1,order_reference:`ORD-${2402+i}`,created_at:created,updated_at:ago(i*35),received_at:created,resolved_at:s.status==='resolved'?ago(i*35):null,first_response_at:assigned?ago(10+i*110):null,notes,events};
 });
 const requests=new Map<string,{hash:string;result:unknown}>();
 let eventNumber=2000;
 function fail(status:number,message:string):never {throw new RequestError(message,status);}
 function page<T extends {id:string}>(rows:T[],params:URLSearchParams):Result<T[]> {
  const limit=Math.min(100,Math.max(1,Number(params.get('limit')||25)));
  const cursor=params.get('cursor');const start=cursor?rows.findIndex(r=>r.id===cursor)+1:0;
  const data=rows.slice(start,start+limit);
  return {data,meta:{next_cursor:start+limit<rows.length?data.at(-1)?.id:null}};
 }
 function metrics(days:number):Metrics {
  const cutoff=Date.now()-days*86400000;
  const response=tickets.filter(t=>t.first_response_at&&Date.parse(t.created_at)>=cutoff).map(t=>(Date.parse(t.first_response_at!)-Date.parse(t.received_at))/60000).sort((a,b)=>a-b);
  const middle=Math.floor(response.length/2);
  return {open:tickets.filter(t=>t.status!=='resolved').length,unassigned:tickets.filter(t=>!t.assigned_to&&t.status!=='resolved').length,waiting:tickets.filter(t=>t.status==='waiting_customer').length,resolved:tickets.filter(t=>t.resolved_at&&Date.parse(t.resolved_at)>=cutoff).length,mine:tickets.filter(t=>t.assigned_to===actor.id&&t.status!=='resolved').length,response_minutes:response.length?(response.length%2?response[middle]:(response[middle-1]+response[middle])/2):null,period:days};
 }
 function read(path:string):Result<unknown> {
  const url=new URL(path,'http://demo.invalid');const [, , ,resource,target]=url.pathname.split('/');const p=url.searchParams;
  const q=(p.get('q')||'').trim().toLocaleLowerCase('id-ID');
  if(resource==='me')return {data:actor};
  if(resource==='metrics')return {data:metrics(Number(p.get('days')||7))};
  if(resource==='requests')return {data:requests.get(target)?.result??null};
  if(resource==='tickets'){
   if(target){const t=tickets.find(t=>t.id===target);if(!t)fail(404,'Tiket demo tidak ditemukan.');return {data:t,meta:{notes_cursor:null,events_cursor:null}};}
   return page(tickets.filter(t=>(!q||`${t.subject} ${t.order_reference}`.toLocaleLowerCase('id-ID').includes(q))&&(!p.get('status')||t.status===p.get('status'))&&(!p.get('priority')||t.priority===p.get('priority'))&&(!p.get('customer')||t.customer_id===p.get('customer'))&&(!p.get('order')||t.order_reference===p.get('order'))&&(!p.get('owner')||(p.get('owner')==='unassigned'?!t.assigned_to:t.assigned_to===(p.get('owner')==='me'?actor.id:p.get('owner'))))),p);
  }
  if(resource==='customers')return page(customers.filter(c=>c.name.toLocaleLowerCase('id-ID').includes(q)),p);
  if(resource==='faqs')return page(faqs.filter(f=>(f.is_published||actor.role==='admin')&&f.question.toLocaleLowerCase('id-ID').includes(q)),p);
  if(resource==='team')return page(members.filter(m=>m.display_name.toLocaleLowerCase('id-ID').includes(q)),p);
  return fail(404,'Halaman demo tidak tersedia.');
 }
 function write(path:string,body:unknown,method:string):unknown {
  const [, , ,resource,target,operation]=path.split('/');
  if(resource==='team'&&target==='invitations'){
   const input=z.strictObject({email:z.email(),display_name:z.string().trim().min(1).max(160)}).parse(body);
   const member:Profile={id:crypto.randomUUID(),display_name:input.display_name,role:'agent',is_active:true};members.unshift(member);return member;
  }
  const actions:Record<string,Action>={claim:'ticket.claim',assign:'ticket.assign',notes:'ticket.note',responses:'ticket.response',status:'ticket.status',faqs:'ticket.faq'};
  const action=resource==='tickets'?(target?(method==='PUT'?'ticket.update':actions[operation]):'ticket.create'):resource==='customers'?'customer.create':resource==='faqs'?'faq.save':resource==='team'?'team.update':undefined;
  if(!action)fail(404,'Tindakan demo tidak tersedia.');
  const input:Record<string,unknown>=schemas[action].parse(body);
  const rid=String(input.request_id),hash=JSON.stringify({path,method,input}),cached=requests.get(rid);
  if(cached){if(cached.hash!==hash)fail(409,'ID permintaan demo sudah dipakai dengan isi berbeda.');return cached.result;}
  let result:unknown;
  if(action==='customer.create'){
   if(input.contact_reference&&customers.some(c=>c.contact_reference?.toLowerCase()===String(input.contact_reference).toLowerCase()))fail(409,'Referensi kontak ini sudah tercatat.');
   const customer:Customer={id:crypto.randomUUID(),name:String(input.name),contact_reference:String(input.contact_reference)||null,created_at:new Date().toISOString()};customers.unshift(customer);result=customer;
  }else if(action==='faq.save'){
   const faq:Faq={id:target||crypto.randomUUID(),question:String(input.question),answer:String(input.answer),is_published:Boolean(input.is_published),updated_at:new Date().toISOString()};
   const i=faqs.findIndex(f=>f.id===target);if(i>=0)faqs[i]=faq;else faqs.unshift(faq);result=faq;
  }else if(action==='team.update'){
   const member=members.find(m=>m.id===target);if(!member)fail(404,'Petugas demo tidak ditemukan.');
   if(member.role==='admin'&&member.is_active&&(input.role!=='admin'||!input.is_active)&&members.filter(m=>m.role==='admin'&&m.is_active).length===1)fail(422,'Admin aktif terakhir tidak dapat dinonaktifkan atau diturunkan perannya.');
   member.role=input.role as Profile['role'];member.is_active=Boolean(input.is_active);result=member;
  }else if(action==='ticket.create'){
   const customer=customers.find(c=>c.id===input.customer_id);if(!customer)fail(422,'Pilih pelanggan demo yang tersedia.');
   const time=new Date().toISOString();
   const ticket:DemoTicket={id:crypto.randomUUID(),number:String(Math.max(...tickets.map(t=>Number(t.number)))+1),customer_id:customer.id,customers:customer,subject:String(input.subject),summary:String(input.summary),category:input.category as Ticket['category'],channel:input.channel as Ticket['channel'],priority:input.priority as Ticket['priority'],order_reference:String(input.order_reference)||null,status:'new',assigned_to:null,created_by:actor.id,version:1,created_at:time,updated_at:time,received_at:String(input.received_at||time),resolved_at:null,first_response_at:null,notes:[],events:[{id:String(++eventNumber),actor_id:actor.id,event_type:'created',details:{},created_at:time}]};tickets.unshift(ticket);result=ticket;
  }else{
   const index=tickets.findIndex(t=>t.id===target);if(index<0)fail(404,'Tiket demo tidak ditemukan.');
   const t=structuredClone(tickets[index]);
   if(t.version!==input.version)fail(409,'Tiket telah berubah. Muat ulang data sebelum mencoba kembali.');
   const time=new Date().toISOString(),details:Record<string,string>={from_status:t.status};
   if(action==='ticket.claim'){
    if(t.assigned_to||t.status!=='new')fail(409,'Tiket demo ini sudah diambil.');t.assigned_to=actor.id;t.status='in_progress';
   }else if(action==='ticket.assign'){
    if(t.status==='resolved'||!members.some(m=>m.id===input.assigned_to&&m.is_active))fail(422,'Pilih petugas aktif untuk tiket yang belum selesai.');
    t.assigned_to=String(input.assigned_to);t.status='in_progress';details.assignment_reason=String(input.reason);
   }else if(action==='ticket.update'){
    Object.assign(t,{subject:input.subject,summary:input.summary,category:input.category,channel:input.channel,priority:input.priority,order_reference:input.order_reference||null});
   }else if(action==='ticket.note'||action==='ticket.response'){
    const sent=action==='ticket.response'?String(input.sent_at):null;
    if(sent&&Date.parse(sent)<Date.parse(t.received_at))fail(422,'Waktu balasan harus setelah waktu penerimaan.');
    t.notes.unshift({id:crypto.randomUUID(),author_id:actor.id,body:String(input.body),kind:sent?'response':'internal',sent_at:sent,created_at:time});
    if(sent&&(!t.first_response_at||sent<t.first_response_at))t.first_response_at=sent;
   }else if(action==='ticket.status'){
    const next=input.status as Ticket['status'];
    if(!transitions(t.status,true).includes(next))fail(422,'Perubahan status ini tidak diizinkan.');
    if(['in_progress','waiting_customer','resolved'].includes(next)&&!members.some(m=>m.id===t.assigned_to&&m.is_active))fail(422,'Tiket memerlukan penanggung jawab aktif.');
    const reason=String(input.resolution||input.reason||'');
    if((next==='resolved'||t.status==='resolved')&&reason.length<5)fail(422,'Isi ringkasan penyelesaian atau alasan membuka kembali.');
    if(next==='resolved')t.notes.unshift({id:crypto.randomUUID(),author_id:actor.id,body:reason,kind:'resolution',sent_at:null,created_at:time});
    details.reason=reason;t.status=next;t.resolved_at=next==='resolved'?time:null;
   }else if(action==='ticket.faq'){
    if(!faqs.some(f=>f.id===input.faq_id&&f.is_published))fail(422,'Pilih FAQ yang sudah diterbitkan.');details.faq_id=String(input.faq_id);
   }
   t.version++;t.updated_at=time;details.status=t.status;t.events.unshift({id:String(++eventNumber),actor_id:actor.id,event_type:action,details,created_at:time});tickets[index]=t;result=t;
  }
  requests.set(rid,{hash,result:structuredClone(result)});return result;
 }
 async function api<T>(path:string,body?:unknown,method=body?'POST':'GET'):Promise<Result<T>> {
  try{
   if(!actor.is_active)fail(403,'Akun demo ini dinonaktifkan. Muat ulang halaman untuk memulai ulang.');
   return structuredClone(method==='GET'?read(path):{data:write(path,body,method)}) as Result<T>;
  }catch(error){if(error instanceof z.ZodError)throw new RequestError('Periksa kembali isian demo Anda.',422,Object.fromEntries(error.issues.map(i=>[i.path.join('.'),i.message])));throw error;}
 }
 async function mutate<T>(path:string,body:Record<string,unknown>,method='POST'):Promise<T>{return (await api<T>(path,body,method)).data;}
 return {api,mutate};
}
