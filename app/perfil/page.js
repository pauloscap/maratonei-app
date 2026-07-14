'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_KEY)
export default function Perfil(){
  const router=useRouter(); const [email,setEmail]=useState('')
  useEffect(()=>{ supabase.auth.getSession().then(({data})=>{ if(!data.session) router.push('/login'); else setEmail(data.session.user.email) }) },[])
  async function sair(){ await supabase.auth.signOut(); localStorage.clear(); router.push('/login') }
  return(
    <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',paddingBottom:'90px',color:'#fff'}}>
      <h1 style={{color:'#FACC15'}}>👤 Perfil</h1>
      <div style={{background:'#1E293B',padding:'16px',borderRadius:'12px',marginTop:'16px'}}><div style={{color:'#94A3B8',fontSize:'13px'}}>Logado como</div><div style={{fontWeight:700}}>{email}</div></div>
      <button onClick={sair} style={{marginTop:'20px',width:'100%',background:'#EF4444',border:'none',padding:'12px',borderRadius:'10px',color:'#fff',fontWeight:800,cursor:'pointer'}}>Sair da conta</button>
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#1E293B',borderTop:'1px solid #334155',display:'flex',justifyContent:'space-around',padding:'10px 0'}}>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>📺</span>Séries</button>
        <button onClick={()=>router.push('/filmes')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🎬</span>Filmes</button>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🔍</span>Busca</button>
        <button style={{background:'none',border:'none',color:'#FACC15',fontSize:'11px',fontWeight:700,display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>👤</span>Perfil</button>
      </nav>
    </main>
  )
}
