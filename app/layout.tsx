import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Luma Support — Workspace layanan pelanggan',description:'Workspace privat untuk tiket, pelanggan, dan pengetahuan tim.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="id"><body>{children}</body></html>;}
