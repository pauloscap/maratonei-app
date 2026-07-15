"use client"
import { useEffect, useState } from "react"
import { getSupa } from "../../lib/supabase"
import { BottomNav } from "../../components/BottomNav"

const supa = getSupa()
const hojeISO = () => new Date().toISOString().slice(0,10)

export default function PerfilPage() {
  const [nome, setNome] = useState("Você")
  const [letra, setLetra] = useState("P")
  const [stats, setStats] = useState({ total:0, mar:0, horas:0, nivel:1, xp:0 })
  const [checkins, setCheckins] = useState([])
  const [streak, setStreak] = useState(0)
  const [missoes, setMissoes] = useState([])
  const [showEdit, setShowEdit] = useState(false)

  useEffect(()=>{
    const n = localStorage.getItem("perfil-nome") || "Você"
    setNome(n); setLetra(n[0]?.toUpperCase()||"P")
    load()
  }, [])

  async function load(){
    let sTotal=0, fTotal=0, mar=0, horas=0
    try{
      const {data:s}=await supa.from("series").select("id"); sTotal=s?.length||0
      const {data:f}=await supa.from("filmes").select("id"); fTotal=f?.length||0
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k?.includes("status-")&&localStorage.getItem(k)==="ja_assisti") mar++; if(k?.startsWith("progress-")){ try{horas+=JSON.parse(localStorage.getItem(k)||"[]").length*0.7}catch{}} }
    }catch{}
    const total=sTotal+fTotal; const xp=mar*100+Math.floor(horas*5)+fTotal*30+ (JSON.parse(localStorage.getItem("checkins")||"[]").length*15)
    const nivel=Math.max(1, Math.floor(xp/150)+1)
    setStats({total, mar, horas:Math.round(horas), nivel, xp})

    const c=JSON.parse(localStorage.getItem("checkins")||"[]"); setCheckins(c)
    let seq=0; const hoje=new Date(); for(let i=0;i<30;i++){ const d=new Date(); d.setDate(hoje.getDate()-i); if(c.includes(d.toISOString().slice(0,10))) seq++; else if(i>0) break } setStreak(seq)

    setMissoes([
      { id:"diaria", t:"Check-in diário", d:`${c.includes(hojeISO())?1:0}/1`, p:c.includes(hojeISO())?100:0, xp:15, ok:c.includes(hojeISO()) },
      { id:"semana3", t:"Assista 3 dias na semana", d:`${Math.min(seq,3)}/3`, p:Math.min(seq/3*100,100), xp:50, ok:seq>=3 },
      { id:"maratona", t:"Maratone 1 título", d:`${mar>=1?1:0}/1`, p:mar>=1?100:0, xp:100, ok:mar>=1 },
      { id:"explorador", t:"Tenha 10 títulos salvos", d:`${Math.min(total,10)}/10`, p:Math.min(total/10*100,100), xp:80, ok:total>=10 },
    ])
  }

  const doCheckin = () => {
    const h=hojeISO(); if(checkins.includes(h)) return
    const novo=[...checkins,h]; localStorage.setItem("checkins", JSON.stringify(novo)); setCheckins(novo); load()
  }

  const salvarNome = () => { localStorage.setItem("perfil-nome", nome); setLetra(nome[0]?.toUpperCase()||"P"); setShowEdit(false) }

  const dias=Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d.toISOString().slice(0,10) })

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90 }}>
      <header style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", position:"sticky", top:0, background:"#080B1F", zIndex:5 }}><b>Perfil</b><button onClick={()=>setShowEdit(!showEdit)} style={{ background:"#ffffff10", border:0, color:"#fff", borderRadius:999, padding:"6px 12px", fontSize:12 }}>✏️ Editar</button></header>

      <main style={{ maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12 }}>
        {showEdit && <div style={{ background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12, display:"flex", gap:8 }}><input value={nome} onChange={e=>setNome(e.target.value)} style={{ flex:1, background:"#ffffff10", border:"1px solid #ffffff15", borderRadius:10, padding:"10px 12px", color:"#fff", outline:"none" }} placeholder="Seu nome"/><button onClick={salvarNome} style={{ background:"#FFD400", border:0, borderRadius:10, padding:"0 14px", fontWeight:800, color:"#000" }}>Salvar</button></div>}

        <div style={{ background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:999, background:"linear-gradient(135deg,#FFD400,#FFA600)", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:20 }}>{letra}</div>
          <div style={{ flex:1 }}
