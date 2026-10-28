import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoClient} from '../lib/demo.ts';
import {RequestError} from '../lib/client.ts';
import type {Customer,Faq,Metrics,Profile,Ticket,Note,TicketEvent} from '../lib/domain.ts';

type Detail=Ticket&{notes:Note[];events:TicketEvent[]};
const payload=()=>({request_id:crypto.randomUUID()});

test('demo has synthetic content, computed metrics, search and pagination',async()=>{
 const {api}=createDemoClient();
 const tickets=await api<Ticket[]>('/api/v1/tickets');
 const customers=await api<Customer[]>('/api/v1/customers');
 assert.equal(tickets.data.length,12);
 assert.equal(customers.data.length,8);
 assert.ok(customers.data.every(c=>c.contact_reference?.endsWith('@example.invalid')));
 assert.equal((await api<Profile[]>('/api/v1/team')).data.length,3);
 assert.equal((await api<Faq[]>('/api/v1/faqs')).data.length,5);
 const counts=(await api<Metrics>('/api/v1/metrics?days=7')).data;
 assert.deepEqual([counts.open,counts.unassigned,counts.waiting,counts.resolved],[9,3,2,3]);
 assert.equal((await api<Ticket[]>('/api/v1/tickets?q=ORD-2402')).data.length,1);
 assert.equal((await api<Ticket[]>('/api/v1/tickets?status=waiting_customer')).data.length,2);
 assert.equal((await api<Ticket[]>('/api/v1/tickets?owner=unassigned')).data.length,3);
 const page1=await api<Ticket[]>('/api/v1/tickets?limit=5');
 const page2=await api<Ticket[]>(`/api/v1/tickets?limit=5&cursor=${page1.meta?.next_cursor}`);
 assert.equal(page1.data.length,5);assert.equal(page2.data.length,5);
 assert.ok(page2.data.every(t=>!page1.data.some(p=>p.id===t.id)));
});

test('demo handles create, claim, notes, resolution and reopen without network',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error('Demo must not call a real API');};
 try{
  const {api,mutate}=createDemoClient();
  const customer=await mutate<Customer>('/api/v1/customers',{...payload(),name:'Pelanggan Presentasi',contact_reference:'presentasi@example.invalid'});
  let t=await mutate<Detail>('/api/v1/tickets',{...payload(),customer_id:customer.id,subject:'Contoh permintaan saat demo',summary:'Pelanggan meminta pembaruan pengiriman.',category:'shipping',channel:'whatsapp',priority:'normal'});
  const path=`/api/v1/tickets/${t.id}`;
  assert.equal(t.status,'new');
  t=await mutate<Detail>(`${path}/claim`,{...payload(),version:t.version});
  assert.equal(t.status,'in_progress');
  const note={...payload(),version:t.version,body:'Memeriksa status pengiriman contoh.'};
  t=await mutate<Detail>(`${path}/notes`,note);
  await mutate(`${path}/notes`,note);
  assert.equal((await api<Detail>(path)).data.notes.length,1);
  await assert.rejects(mutate(`${path}/notes`,{...note,body:'Isi retry yang berbeda.'}),(e:unknown)=>e instanceof RequestError&&e.status===409);
  await assert.rejects(mutate(`${path}/status`,{...payload(),version:1,status:'resolved',resolution:'Data lama tidak boleh menimpa.'}),(e:unknown)=>e instanceof RequestError&&e.status===409);
  t=await mutate<Detail>(`${path}/status`,{...payload(),version:t.version,status:'resolved',resolution:'Pelanggan menerima paket dan mengonfirmasi.'});
  assert.equal(t.status,'resolved');assert.ok(t.resolved_at);
  assert.equal(t.notes.filter(n=>n.kind==='resolution').length,1);
  assert.equal((await api<Metrics>('/api/v1/metrics')).data.resolved,4);
  t=await mutate<Detail>(`${path}/status`,{...payload(),version:t.version,status:'in_progress',reason:'Pelanggan melaporkan kendala lanjutan.'});
  assert.equal(t.resolved_at,null);assert.equal(t.notes.length,2);
  assert.equal((await api<Ticket[]>(`/api/v1/tickets?customer=${customer.id}`)).data.length,1);
 }finally{globalThis.fetch=original;}
});

test('demo sessions are isolated and reads cannot change stored fixtures',async()=>{
 const a=createDemoClient(),b=createDemoClient();
 const t=(await a.api<Detail[]>('/api/v1/tickets')).data[0];
 const original=t.subject;t.subject='Attempt to change a read result';
 assert.equal((await a.api<Detail>(`/api/v1/tickets/${t.id}`)).data.subject,original);
 await a.mutate(`/api/v1/tickets/${t.id}/claim`,{...payload(),version:t.version});
 assert.equal((await a.api<Detail>(`/api/v1/tickets/${t.id}`)).data.status,'in_progress');
 assert.equal((await b.api<Detail>(`/api/v1/tickets/${t.id}`)).data.status,'new');
});

test('demo FAQ and team edits work while the last admin remains protected',async()=>{
 const {api,mutate}=createDemoClient();
 const admin=(await api<Profile>('/api/v1/me')).data;
 await assert.rejects(mutate(`/api/v1/team/${admin.id}`,{...payload(),role:'agent',is_active:false},'PUT'),(e:unknown)=>e instanceof RequestError&&e.status===422);
 await api('/api/v1/team/invitations',{email:'demo-invite@example.invalid',display_name:'Petugas Presentasi'});
 assert.equal((await api<Profile[]>('/api/v1/team')).data.length,4);
 const faq=await mutate<Faq>('/api/v1/faqs',{...payload(),question:'Bagaimana cara menggunakan demo?',answer:'Buka tiket contoh dan tambahkan tindak lanjut.',is_published:true});
 assert.equal((await api<Faq[]>('/api/v1/faqs?q=menggunakan')).data[0].id,faq.id);
 await mutate(`/api/v1/faqs/${faq.id}`,{...payload(),question:faq.question,answer:'Jawaban demo sudah diperbarui.',is_published:false},'PUT');
 assert.equal((await api<Faq[]>('/api/v1/faqs?q=menggunakan')).data[0].is_published,false);
});
