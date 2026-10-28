import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mutate,RequestError} from '../lib/client.ts';

test('timeout recovers committed result by request ID without creating again',async()=>{
 const original=globalThis.fetch;const paths:string[]=[];
 globalThis.fetch=async(url)=>{paths.push(String(url));if(paths.length===1)throw new TypeError('network');return Response.json({data:{id:'committed'}});};
 try{assert.deepEqual(await mutate('/api/v1/tickets',{request_id:'same-id'}),{id:'committed'});assert.deepEqual(paths,['/api/v1/tickets','/api/v1/requests/same-id']);}finally{globalThis.fetch=original;}
});
test('version conflict is returned to the draft form with no automatic overwrite',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({error:{message:'Tiket sudah berubah'}},{status:409});};
 try{await assert.rejects(mutate('/api/v1/tickets/id',{request_id:'same-id'}),(e:unknown)=>e instanceof RequestError&&e.status===409);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('uncommitted network error stays an error instead of reporting success',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;if(calls===1)throw new TypeError('network');return Response.json({data:null});};
 try{await assert.rejects(mutate('/api/v1/tickets',{request_id:'same-id'}),(e:unknown)=>e instanceof RequestError&&e.status===0);assert.equal(calls,2);}finally{globalThis.fetch=original;}
});
