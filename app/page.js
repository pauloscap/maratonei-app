"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function Home(){
  const [userId,setUserId]=useState("anon")
  const [busca,setBusca]=useState("")
  const [series,setSeries]=useState([])

  // Séries com imagem que NUNCA quebra (picsum + tmdb real)
  const baseSeries = [
    { id:101, titulo:"Abbott Elementary", ano:"2021", status:"assistindo", img:"https://picsum.photos/seed/abbott101/400/600" },
    { id:102, titulo:"X-Men '97", ano:"2024", status:"assistindo", img:"https://picsum.photos/seed/xmen97/400/600" },
    { id:103, titulo:"Off Campus: Amor...", ano:"2025", status:"assistindo", img:"https://picsum.photos/seed/offcampus/400/600" },
    { id:104, titulo:"The Walking Dead", ano:"2010", status:"assistindo", img:"https://picsum.photos/seed/twd/400/600" },
    { id:201, titulo:"Elle: Legalmente Loira", ano:"2025", status:"ja_assisti", img:"https://picsum.photos/seed/elle/400/600" },
    { id:301, titulo:"Stranger Things", ano:"2016", status:"maratonei", img:"https://picsum.photos/seed/stranger/400/600" },
    { id:302, titulo:"The Last of Us", ano:"2023", status:"maratonei", img:"https://picsum.photos/seed/tlou/400/600" },
  ]

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const uid = session.user.id
      setUserId(uid)

      const carregadas = baseSeries.map(s=>{
        const st = localStorage.getItem(`${uid}:status-${s.id}`)
        return st ? { ...s, status: st } : s
      })
      setSeries(carregadas)
    })()
  },[])

  const abrirSerie = (s)=>{
    localStorage.setItem(`${userId}:serie-atual`, JSON.stringify(s))
    location.href = `/serie/${s.id}`
  }

  const filtradas = useMemo(()=>{
    if(!busca) return series
    return series.filter(s=> s.titulo.toLowerCase().includes(busca.toLowerCase()))
  },[series,busca])

  const assistindo = filtradas.filter(s=>s.status==="assistindo")
  const jaAssisti = filtradas.filter(s=>s.status==="ja_assisti")
  const maratonei = filtradas.filter(s=>s.status==="maratonei")

  const Card = ({s})=>(
    <div onClick={()=>abrirSerie(s)} style={{width:124, cursor:"pointer", flexShrink:0}}>
      <div style={{width:124, height:184, borderRadius:12, overflow:"hidden", background:"#12182F", border:"1px solid #FFD400", position:"relative"}}>
        <img src={s.img} alt={s.titulo} loading="lazy" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
        <div style={{position:"absolute", top:6, left:6, background:"#FFD400", color:"#000", fontSize:8, fontWeight:900, padding:"3px 6px", borderRadius:6, textTransform:"uppercase"}}>
          {s.status==="ja_assisti"?"Já Assisti":s.status}
        </div>
        <div style={{position:"absolute", bottom:0, left:0, right:0, height:4, background: s.status==="maratonei"?"#22c55e":s.status==="ja_assisti"?"#3b82f6":"#FFD400"}}/>
      </div>
      <div style={{fontSize:12, fontWeight:700, marginTop:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"#fff"}}>{s.titulo}</div>
    </div>
  )

  const Secao = ({titulo, cor, qtd, children})=>(
    <div style={{marginTop:22}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
        <div style={{width:3, height:14, background:cor, borderRadius:99}}/>
        <b style={{fontSize:14, color:"#fff"}}>{titulo}</b>
        <span style={{fontSize:11, opacity:.4}}>• {qtd}</span>
      </div>
      <div style={{display:"flex", gap:12, overflowX:"auto", paddingBottom:6, scrollbarWidth:"none"}}>{children.length?children:<span style={{fontSize:12, opacity:.3}}>Nenhuma série aqui</span>}</div>
    </div>
  )

  return(
    <div style={{minHeight:"100vh", background:"#0A0F2A", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", borderBottom:"1px solid #ffffff0f", position:"sticky", top:0, background:"#0A0F2A", zIndex:10}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#FFD400",color:"#000",display
