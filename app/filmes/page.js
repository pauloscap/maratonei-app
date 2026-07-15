"use client"
import Link from "next/link"
import { BottomNav } from "../../components/BottomNav"

export default function FilmesPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:60, padding:"0 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10 }}>
        <h1 style={{ fontSize:18, fontWeight:800, fontFamily:"Sora,sans-serif" }}>Filmes</h1>
        <span style={{ marginLeft:10, fontSize:11, background:"#FFD400", color:"#000", padding:"2px 8px", borderRadius:99, fontWeight:800 }}>EM BREVE</span>
      </header>

      <main style={{ maxWidth:600, margin:"40px auto", textAlign:"center", padding:"0 20px" }}>
        <div style={{ width:80, height:80, borderRadius:20, background:"#121B3A", display:"grid", placeItems:"center", margin:"0 auto 16px", fontSize:32 }}>▶</div>
        <h2 style={{ fontSize:20, fontWeight:800, fontFamily:"Sora,sans-serif" }}>Seu cinema pessoal</h2>
        <p style={{ opacity:.5, fontSize:14, marginTop:8, lineHeight:1.5 }}>Aqui você vai controlar seus filmes igual já faz com séries. Mesma barra amarela, mesmo progresso.</p>
        <Link href="/" style={{ display:"inline-block", marginTop:20, background:"#FFD400", color:"#000", padding:"10px 18px", borderRadius:999, fontWeight:800, textDecoration:"none", fontSize:13 }}>Voltar para Séries</Link>
      </main>

      <BottomNav />
    </div>
  )
}
