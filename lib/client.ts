export class RequestError extends Error {
 status:number;
 fields?:Record<string,string>;
 constructor(message:string,status:number,fields?:Record<string,string>){super(message);this.status=status;this.fields=fields;}
}
export type Result<T>={data:T;meta?:{next_cursor?:string|null;notes_cursor?:string|null;events_cursor?:string|null}};
export async function api<T>(path:string,body?:unknown,method=body?'POST':'GET'):Promise<Result<T>> {
 let response:Response;
 try {response=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});}
 catch {throw new RequestError('Koneksi terputus. Periksa jaringan lalu coba kembali.',0);}
 const json=await response.json().catch(()=>null);
 if(!response.ok) throw new RequestError(json?.error?.message??'Layanan belum tersedia.',response.status,json?.error?.fields);
 return json;
}
// A timed-out mutation is recovered by its original request ID before retrying.
export async function mutate<T>(path:string,body:Record<string,unknown>,method='POST'):Promise<T> {
 try {return (await api<T>(path,body,method)).data;}
 catch(error) {
  if(error instanceof RequestError && (error.status===0||error.status>=500)) {
   const recovered=await api<T|null>(`/api/v1/requests/${body.request_id}`).catch(()=>null);
   if(recovered?.data) return recovered.data;
  }
  throw error;
 }
}
