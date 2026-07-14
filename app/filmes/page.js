'use client'
import { useRouter } from 'next/navigation'
export default function Filmes(){
  const router=useRouter()
  return(
    <main style={{background:'#0F172A',minHeight:'100vh',padding:'20px',paddingBottom:'90px',color:'#fff'}}>
      <h1 style={{color:'#FACC15'}}>🎬 Filmes - Em breve</h1>
      <p style={{color:'#94A3B8'}}>Vamos fazer igual séries depois que finalizar.</p>
      <button onClick={()=>router.push('/')} style={{marginTop:'20px',background:'#FACC15',border:'none',padding:'10px 16px',borderRadius:'8px',fontWeight:800,cursor:'pointer'}}>Voltar pra Séries</button>
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#1E293B',borderTop:'1px solid #334155',display:'flex',justifyContent:'space-around',padding:'10px 0'}}>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>📺</span>Séries</button>
        <button style={{background:'none',border:'none',color:'#FACC15',fontSize:'11px',fontWeight:700,display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🎬</span>Filmes</button>
        <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>🔍</span>Busca</button>
        <button onClick={()=>router.push('/perfil')} style={{background:'none',border:'none',color:'#64748B',fontSize:'11px',display:'flex',flexDirection:'column',alignItems:'center'}}><span style={{fontSize:'20px'}}>👤</span>Perfil</button>
      </nav>
    </main>
  )
}
