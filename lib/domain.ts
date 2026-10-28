export const statuses = {new:'Baru',in_progress:'Ditangani',waiting_customer:'Menunggu pelanggan',escalated:'Eskalasi',resolved:'Selesai'} as const;
export const categories = {general:'Umum',shipping:'Pengiriman',product:'Produk',payment:'Pembayaran',return:'Retur & pengembalian'} as const;
export const channels = {whatsapp:'WhatsApp',marketplace:'Marketplace',email:'Email',phone:'Telepon',other:'Lainnya'} as const;
export type Status = keyof typeof statuses;
export type Profile = {id:string;display_name:string;role:'admin'|'agent';is_active:boolean};
export type Customer = {id:string;name:string;contact_reference:string|null;created_at:string};
export type Ticket = {id:string;number:string;customer_id:string;subject:string;summary:string;category:keyof typeof categories;channel:keyof typeof channels;order_reference:string|null;priority:'normal'|'high';status:Status;assigned_to:string|null;created_by:string;version:number;created_at:string;updated_at:string;received_at:string;resolved_at:string|null;customers?:Customer};
export type Note = {id:string;author_id:string;body:string;kind:'internal'|'response'|'resolution';sent_at:string|null;created_at:string};
export type TicketEvent = {id:string;actor_id:string;event_type:string;details:Record<string, string>;created_at:string};
export type Faq = {id:string;question:string;answer:string;is_published:boolean;updated_at:string};
export type Metrics = {open:number;unassigned:number;waiting:number;resolved:number;mine:number;response_minutes:number|null;period:number};
export function transitions(status:Status, admin:boolean):Status[] {
 switch(status) {
  case 'new': return ['escalated'];
  case 'in_progress': return ['waiting_customer','escalated','resolved'];
  case 'waiting_customer': return ['in_progress','resolved'];
  case 'escalated': return admin ? ['in_progress'] : [];
  case 'resolved': return ['in_progress','escalated'];
 }
}
export function dateTime(value:string) {return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
