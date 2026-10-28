'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {RequestError} from '@/lib/client';
import Icon from './icons';

export const DemoContext=createContext(false);

export function Modal({title,description,children,onClose,wide=false}:{title:string;description?:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null),dirty=useRef(false);
 useEffect(()=>{ref.current?.showModal();},[]);
 function close(){if(!dirty.current||confirm('Form belum disimpan. Tinggalkan perubahan?')) onClose();}
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} onCancel={e=>{e.preventDefault();close();}} onInput={()=>{dirty.current=true;}}><div className="modal-heading"><div><span className="overline">LUMA WORKSPACE</span><h2>{title}</h2>{description&&<p>{description}</p>}</div><button className="icon-button" aria-label="Tutup dialog" onClick={close}><Icon name="close"/></button></div>{children}</dialog>;
}
export function AsyncForm({children,onSave,label='Simpan',revision=0}:{children:React.ReactNode;onSave:(data:Record<string,FormDataEntryValue>,requestId:string)=>Promise<void>;label?:string;revision?:number|string}) {
 const demo=useContext(DemoContext);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<{key:string;id:string}|null>(null),lock=useRef(false);
 async function submit(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();if(lock.current)return;
  const form=e.currentTarget,data=Object.fromEntries(new FormData(form));
  const key=JSON.stringify({data,revision});
  if(pending.current?.key!==key) pending.current={key,id:crypto.randomUUID()};
  lock.current=true;setBusy(true);setError('');
  try {await onSave(data,pending.current.id);pending.current=null;form.reset();}
  catch(e){setError(e instanceof RequestError&&e.fields?Object.values(e.fields).join('. '):e instanceof Error?e.message:'Perubahan belum tersimpan.');if(e instanceof RequestError&&e.fields){const field=form.elements.namedItem(Object.keys(e.fields)[0]);if(field instanceof HTMLElement)field.focus();}}
  finally{lock.current=false;setBusy(false);}
 }
 return <form onSubmit={submit} className="data-form"><fieldset disabled={busy}>{children}</fieldset>{error&&<div className="form-error" role="alert">{error}</div>}<div className="form-actions"><span className="muted">{demo?'Demo: perubahan sementara di halaman ini.':busy?'Menunggu konfirmasi server…':'Perubahan disimpan ke database.'}</span><button className="primary" disabled={busy}>{busy?'Menyimpan…':label}<Icon name="check" size={17}/></button></div></form>;
}
export function Empty({title,description,action}:{title:string;description:string;action?:React.ReactNode}) {return <div className="empty"><div className="empty-icon"><Icon name="tickets" size={26}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;}
