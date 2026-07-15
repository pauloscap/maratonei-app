"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
export default function Home(){
 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{
    if(!data.session) location.href="/login"
  })
 },[])
 // ... resto do seu código da Home
}
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loadSeries, loadLS, buscarTMDB, addSerie } from "../lib/homeLogic"
import { SearchDropdown } from "../components/SearchDropdown"
import { SectionRow } from "../components/SectionRow"
import { BottomNav } from "../components/BottomNav"

export default function Home() {
  const router = useRouter()
  const [S, setS] = useState([])
  const [M, setM] = useState({})
  const [P, setP] = useState({})
  const [q, setQ] = useState("")
  const [R, setR] = useState([])
  const [ok, setOk] = useState(false)

  useEffect(() => { setOk(true); loadSeries(setS) }, [])
  useEffect(() => { if (ok && S.length) loadLS(S, setM, setP) }, [ok, S])

  const isM = id => M[id]==="ja_maratonei" || (P[id]||[]).includes("100%")
  const isA = id =>!isM(id) && (M[id]==="assistindo" || (P[id]||[]).length>0)
  const pct = id => { const pr=P[id]||[]; if(!pr.length) return 0; if(pr.includes("100%")) return 100; return Math.min(100, Math.round(pr.length*7)) }

  let mar=[], ass=[], que=[]
  S.forEach(x => isM(x.id)? mar.push(x) : isA(x.id)? ass.push(x) : que.push(x))

  if (!ok) return <div style={{ background:"#080F25", minHeight:"100vh" }} />

  return (
    <div style={{ minHeight:"100vh", background:"#080F25", color:"#fff", fontFamily:"Inter,Sora,sans-serif", paddingBottom:90 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=Sora:wght@600;700&display=swap" rel="stylesheet" />

      <header style={{ height:60, display:"flex", justifyContent:"space-between", padding:"0 16px", alignItems:"center", position:"sticky", top:0, background:"rgba(8,15,37,.9)", backdropFilter:"blur(12px)", zIndex:10, borderBottom:"1px solid #ffffff10" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", fontWeight:800, fontSize:18 }}><div style={{ width:32, height:32, borderRadius:10, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900 }}>M</div>maratonei</div>
        <Link href="/perfil" style={{ width:34, height:34, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:800, textDecoration:"none" }}>P</Link>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"16px 12px" }}>
        <div style={{ position:"relative", maxWidth:560, margin:"0 auto 20px" }}>
          <input value={q} onChange={e=>{ setQ(e.target.value); buscarTMDB(e.target.value, setR)}} placeholder="Buscar série para adicionar..." style={{ width:"100%", height:46, borderRadius:999, background:"#121B3A", border:"1px solid #ffffff18", padding:"0 16px 0 42px", color:"#fff", outline:"none" }} />
          <span style={{ position:"absolute", left:15, top:12, opacity:.5 }}>🔍</span>
          <SearchDropdown results={R} onAdd={(r,go)=> addSerie(r,setS,S,setM,setP,router,go)} />
        </div>
        <SectionRow title="Assistindo" color="#FFD400" list={ass} pct={pct} isM={isM} hl />
        <SectionRow title="Já Assisti" color="#ffffff30" list={que} pct={pct} isM={isM} />
        <SectionRow title="Já Maratonei" color="#22c55e" list={mar} pct={pct} isM={isM} />
      </main>

      <BottomNav />
    </div>
  )
}
