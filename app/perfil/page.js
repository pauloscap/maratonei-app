"use client"
import { useEffect, useState } from "react"
import { getSupa } from "../../lib/supabase"
import { BottomNav } from "../../components/BottomNav"
import { MOLDURAS, getMoldura } from "../../lib/moldurasLogic"

const supa = getSupa()
const hojeISO = () => new Date().toISOString().slice(0,10)

export default function PerfilPage(){
  const [nome,setNome] = useState("Paulo Garcia")
  const [stats,setStats] = useState({t:10,m:1,h:194,n:8,xp:1144})
  const [cks,setCks] = useState([])
  const [seq,setSeq] = useState(1)
  const [molduraId,setMolduraId] = useState("padrao")
  const [show,setShow] = useState(false)

  useEffect(()=>{
    const n = localStorage.getItem("perfil-nome") || "Paulo Garcia"
    const mid = localStorage.getItem("perfil-moldura") || "padrao"
    setNome(n); setMolduraId(mid)
    const c = JSON.parse(localStorage.getItem("checkins")||"[]")
    setCks(c)
  },[])

  const doCheck = ()=>{
    const h = hojeISO()
    if(cks.includes(h)) return
    const novo = [...cks,h]
    localStorage.setItem("checkins", JSON.stringify(novo))
    setCks(novo); setSeq(s=>s+1)
  }

  const escolher = (id,nivel)=>{
    if(stats.n < nivel) return alert("Chegue no nivel "+nivel)
    localStorage.setItem("perfil-moldura", id)
    setMolduraId(id); setShow(false)
  }

  const mAtual = getMoldura(molduraId)
  const dias = Array.from({length:30},(_,i)=>{
    const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d
  })

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90, fontFamily:"Inter"}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff10", position:"sticky", top:0, background:"#080B1F", zIndex:10}}>
        <b>Perfil</b>
        <button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12, cursor:"pointer"}}>🎨 Molduras</button>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:12}}>
          <div style={{width:48, height:48, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:20, border:`2px solid ${mAtual.preview}`, boxShadow: stats.n>=12? `0 0 12px ${mAtual.preview}`: "none"}}>{nome[0]}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800}}>{nome}</div>
            <div style={{fontSize:12, opacity:.6}}>Nível {stats.n} • {stats.xp} XP • 🔥 {seq} dias • {mAtual.nome}</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:6, overflow:"hidden"}}><div style={{width:"40%", height:"100%", background:"#FFD400"}}/></div>
          </div>
          <button onClick={doCheck} style={{height:34, padding:"0 12px", borderRadius:999, border:0, background: cks.includes(hojeISO())?"#22c55e":"#fff", color: cks.includes(hojeISO())?"#fff":"#000", fontWeight:900, cursor:"pointer"}}>✓</button>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Loja de Molduras</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
            {MOLDURAS.map(m=>{
              const ok = stats.n >= m.nivel
              const ativo = m.id === molduraId
              return <div key={m.id} onClick={()=>escolher(m.id,m.nivel)} style={{border: ativo?"1.5px solid #FFD400":"1px solid #ffffff15", background: ativo?"#FFD40014":"#ffffff06", borderRadius:12, padding:10, textAlign:"center", opacity: ok?1:.4, cursor:"pointer"}}>
                <div style={{width:36, height:36, borderRadius:999, margin:"0 auto", background:m.preview, display:"grid", placeItems:"center", fontWeight:900, color:"#000", border:`2px solid ${m.preview}`}}>{nome[0]}</div>
                <div style={{fontSize:11, fontWeight:700, marginTop:6}}>{m.nome}</div>
                <div style={{fontSize:10, opacity:.5}}>Nv {m.nivel}</div>
                <div style={{fontSize:10, fontWeight:800, marginTop:4, color: ativo?"#FFD400": ok?"#22c55e":"#fff"}}>{ativo?"Equipado": ok?"Liberada":"Bloqueada"}</div>
              </div>
            })}
          </div>
        </div>}

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900}}>{stats.t}</div><div style={{fontSize:11, opacity:.4}}>Títulos</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11, opacity:.4}}>Maratonadas</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:18, fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11, opacity:.4}}>Tempo</div></div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800, fontSize:13, marginBottom:10}}>Calendário • 30 dias</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(10, 1fr)", gap:6}}>
            {dias.map((d,i)=>{
              const iso = d.toISOString().slice(0,10)
              const ok = cks.includes(iso)
              return <div key={i} style={{aspectRatio:"1", borderRadius:7, background: ok?"#22c55e":"#ffffff14", display:"grid", placeItems:"center", fontSize:10, fontWeight:700, opacity: ok?1:.4}}>{d.getDate()}</div>
            })}
          </div>
        </div>
      </main>
      <BottomNav/>
    </div>
  )
}
