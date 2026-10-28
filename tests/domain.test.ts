import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transitions,statuses} from '../lib/domain.ts';
import {schemas,listQuery} from '../lib/validation.ts';

const request_id='eb931f00-d8ab-42bb-b239-8d7a7950d311';
const input={request_id,customer_id:'c57b302d-52b9-491d-8981-9af351ca75b9',subject:'Pesanan belum sampai',summary:'Estimasi pengiriman sudah terlewati.',category:'shipping',channel:'whatsapp',priority:'normal'};
test('creation trims text, supplies safe defaults, and rejects forged identity',()=>{
 const result=schemas['ticket.create'].parse({...input,subject:'  Pesanan belum sampai  '});
 assert.equal(result.subject,'Pesanan belum sampai');
 assert.equal(result.order_reference,'');
 for(const field of ['actor_id','created_by','assigned_to','role','status','version']) assert.equal(schemas['ticket.create'].safeParse({...input,[field]:'admin'}).success,false);
 assert.equal(schemas['ticket.create'].safeParse({...input,received_at:new Date(Date.now()+60000).toISOString()}).success,false);
 assert.equal(schemas['ticket.create'].safeParse({...input,subject:'   '}).success,false);
 assert.equal(schemas['ticket.create'].safeParse({...input,channel:'fake_channel'}).success,false);
});
test('writes require idempotency keys and optimistic versions',()=>{
 assert.equal(schemas['ticket.claim'].safeParse({request_id,version:1}).success,true);
 for(const version of [undefined,0,-1,1.5,'1']) assert.equal(schemas['ticket.claim'].safeParse({request_id,version}).success,false);
 assert.equal(schemas['ticket.note'].safeParse({request_id,version:1,body:'  '}).success,false);
 assert.equal(schemas['ticket.response'].safeParse({request_id,version:1,body:'Balasan nyata',sent_at:new Date(Date.now()+60000).toISOString()}).success,false);
});
test('transitions match operational rules for agent and admin',()=>{
 assert.deepEqual(transitions('new',false),['escalated']);
 assert.deepEqual(transitions('in_progress',false),['waiting_customer','escalated','resolved']);
 assert.deepEqual(transitions('waiting_customer',false),['in_progress','resolved']);
 assert.deepEqual(transitions('escalated',false),[]);
 assert.deepEqual(transitions('escalated',true),['in_progress']);
 assert.deepEqual(transitions('resolved',false),['in_progress','escalated']);
 for(const state of Object.keys(statuses) as (keyof typeof statuses)[]) for(const next of transitions(state,true)) assert.notEqual(next,state);
});
test('pagination bounds, owner IDs and unexpected query fields are validated',()=>{
 assert.equal(listQuery.parse({}).limit,25);
 assert.equal(listQuery.parse({limit:'100',owner:'me'}).limit,100);
 for(const query of [{limit:101},{limit:0},{cursor:'bad'},{owner:'admin'},{sort:'raw sql'},{status:'deleted'}]) assert.equal(listQuery.safeParse(query).success,false);
});
