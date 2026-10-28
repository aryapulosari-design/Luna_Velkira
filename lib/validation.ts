import {z} from 'zod';
const uuid=z.uuid();
const text=(min:number,max:number)=>z.string().trim().min(min,`Minimal ${min} karakter`).max(max,`Maksimal ${max} karakter`);
export const status=z.enum(['new','in_progress','waiting_customer','escalated','resolved']);
const fields={subject:text(5,160),summary:text(5,4000),category:z.enum(['general','shipping','product','payment','return']),channel:z.enum(['whatsapp','marketplace','email','phone','other']),order_reference:text(0,100).default(''),priority:z.enum(['normal','high'])};
const request={request_id:uuid};
const version={version:z.number().int().positive()};
export const schemas={
 'customer.create':z.strictObject({...request,name:text(1,160),contact_reference:text(0,255).default('')}),
 'ticket.create':z.strictObject({...request,...fields,customer_id:uuid,received_at:z.iso.datetime({offset:true}).refine(v=>Date.parse(v)<=Date.now(),'Waktu tidak boleh di masa depan').optional()}),
 'ticket.update':z.strictObject({...request,...version,...fields}),
 'ticket.claim':z.strictObject({...request,...version}),
 'ticket.assign':z.strictObject({...request,...version,assigned_to:uuid,reason:text(5,4000)}),
 'ticket.note':z.strictObject({...request,...version,body:text(5,4000)}),
 'ticket.response':z.strictObject({...request,...version,body:text(5,4000),sent_at:z.iso.datetime({offset:true}).refine(v=>Date.parse(v)<=Date.now(),'Waktu tidak boleh di masa depan')}),
 'ticket.status':z.strictObject({...request,...version,status,resolution:text(5,4000).optional(),reason:text(5,4000).optional()}),
 'ticket.faq':z.strictObject({...request,...version,faq_id:uuid}),
 'faq.save':z.strictObject({...request,question:text(5,300),answer:text(5,4000),is_published:z.boolean()}),
 'team.update':z.strictObject({...request,role:z.enum(['admin','agent']),is_active:z.boolean()}),
};
export type Action=keyof typeof schemas;
export const listQuery=z.strictObject({
 limit:z.coerce.number().int().min(1).max(100).default(25),cursor:uuid.optional(),
 q:text(0,160).default(''),status:status.optional(),owner:z.union([uuid,z.literal('unassigned'),z.literal('me')]).optional(),
 priority:z.enum(['normal','high']).optional(),customer:uuid.optional(),order:text(0,100).optional(),
});
