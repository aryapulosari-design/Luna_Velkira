'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="setup-page"><h1>Workspace belum dapat dimuat</h1><p>Coba muat ulang. Perubahan yang sudah tersimpan tetap berada di database.</p><button onClick={reset}>Coba kembali</button></main>;}
