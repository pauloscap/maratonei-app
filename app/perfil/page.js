"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const hojeISO = ()=>new Date().toISOString().slice(0,10)

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Paulo Rodrigo Garcia")
  const [foto,setFoto]=useState("")
  const [cks,setCks]=useState([])
  const [molduraId,setMolduraId]=useState("padrao")
  const [show,setShow]=useState(false)
  const [stats,setStats]=useState({t:10,m:1,h:194,n:8,xp:1983})

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(data?.session?.user){
        const u=data.session.user
        setUser(u); setNome(u.user_metadata?.full_name||"Paulo Rodrigo Garcia"); setFoto(u.user_metadata?.avatar_url||"")
      } else setNome(localStorage.getItem("perfil-nome")||"Paulo Rodrigo Garcia")
      const c=JSON.parse(localStorage.getItem("checkins")||"[]"); setCks(c)
      setMolduraId(localStorage.getItem("perfil-moldura")||"padrao")
      let mc=1, hr=194, t=10
      for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k?.includes("status-")&&localStorage.getItem(k)=="ja_assisti") mc++}
      const xp=mc*100+Math.floor(hr*5)+c.length*15+1700
      setStats({t,m:mc,h:hr,n:Math.max(8,Math.floor(xp/250)+1),xp})
    })
  },[])

  const doCheck=()=>{const h=hojeISO(); if(cks.includes(h))return; const n=[...cks,h]; localStorage.setItem("checkins",JSON.stringify(n)); setCks(n)}
  const escolher=(id,nv)=>{ if(stats.n<nv) return alert("Nível "+nv+" necessário"); localStorage.setItem("perfil-moldura",id); setMolduraId(id); setShow(false)}
  const mAtual=getMoldura(molduraId)
  const dias=Array.from({length:30},(_,i)=>{const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d})
  const progresso = (stats.xp%250)/2.5
  const falta = 250-(stats.xp%250)

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b><div style={{display:"flex", gap:8}}><button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙️</button><button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button></div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* CARD PRINCIPAL */}
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{width:56, height:56, borderRadius:999, background:"#FFD400", overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#000", border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 3px #12182F, 0 0 12px ${mAtual.preview}88`}}>{foto?<img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:nome[0]}</div>
          <div style={{flex:1}}><div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome}{user&&<span style={{fontSize:9, background:"#22c55e22", color:"#22c55e", border:"1px solid #22c55e33", padding:"2px 6px", borderRadius:99}}>Google</span>}</div><div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • 🔥 {cks.length||1} dias • {mAtual.nome}</div><div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div><div style={{fontSize:10, opacity:.4, marginTop:4}}>Falta {falta} XP para o nível {stats.n+1}</div></div>
          <button onClick={doCheck} style={{width:40,height:40,borderRadius:999,border:0,background:cks.includes(hojeISO())?"#22c55e":"#FFD400",color:cks.includes(hojeISO())?"#fff":"#000",fontWeight:900}}>✓</button>
        </div>

        {/* ESTATISTICAS - RESTAURADO */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.t}</div><div style={{fontSize:11,opacity:.45}}>Títulos</div><div style={{fontSize:10, color:"#22c55e", marginTop:2}}>+2 essa semana</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11,opacity:.45}}>Maratonadas</div><div style={{fontSize:10, color:"#FFD400", marginTop:2}}>Top 15%</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div><div style={{fontSize:10, opacity:.4, marginTop:2}}>~8 dias</div></div>
        </div>

        {/* GAMIFICAÇÃO - RESTAURADO */}
        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border:"1px solid #FFD40022", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:13}}>🎮 Gamificação</b><span style={{fontSize:11, background:"#FFD40022", color:"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #FFD40033"}}>Nível {stats.n}</span></div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}><div style={{fontSize:11,opacity:.5}}>Sequência</div><div style={{fontWeight:800, marginTop:2}}>🔥 {cks.length||1} dias</div><div style={{fontSize:10,opacity:.35}}>Recorde: 12 dias</div></div>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}><div style={{fontSize:11,opacity:.5}}>Conquistas</div><div style={{fontWeight:800, marginTop:2}}>🏆 7/24</div><div style={{fontSize:10,opacity:.35}}>3 lendárias</div></div>
          </div>
          <div style={{display:"flex", gap:6, marginTop:10}}>{["🔥","⭐","🎬","📺","🏆","💎"].map((e,i)=><div key={i} style={{width:32,height:32,borderRadius:8,background:i<4?"#FFD400":"#ffffff12",display:"grid",placeItems:"center",fontSize:14,opacity:i<4?1:.4}}>{e}</div>)}</div>
        </div>

        {/* RANKING PREVIEW - RESTAURADO */}
        <div onClick={()=>location.href="/ranking"} style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:12, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"#FFD40018",border:"1px solid #FFD40030",display:"grid",placeItems:"center"}}>🏆</div><div><div style={{fontWeight:800,fontSize:13}}>Ranking Global</div><div style={{fontSize:11,opacity:.45}}>Você está em #12 • Suba 3 posições</div></div></div><div style={{opacity:.3}}>›</div>
        </div>

        {/* LOJA MOLDURAS MODAL */}
        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Loja de Molduras</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ok=stats.n>=m.nivel; const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>escolher(m.id,m.nivel)} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",opacity:ok?1:.35,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",display:"grid",placeItems:"center",fontWeight:900,background:m.preview,border:`2px solid ${m.preview}`}}>{nome[0]}</div><div style={{fontSize:11,fontWeight:700,marginTop:6}}>{m.nome}</div><div style={{fontSize:10,opacity:.5}}>Nv {m.nivel}</div></div>})}</div></div>}

        {/* CALENDARIO - RESTAURADO */}
        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}><div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>Calendário • 30 dias</span><span style={{fontSize:11,opacity:.4,fontWeight:400}}>{cks.length} check-ins</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:6}}>{dias.map((d,i)=>{const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO(); return <div key={i} title={iso} style={{aspectRatio:"1",borderRadius:8,background:ok?"#22c55e":hoje?"#ffffff18":"#ffffff0e",border:hoje&&!ok?"1px solid #ffffff30":"none",display:"grid",placeItems:"center",fontSize:11,fontWeight:ok?800:400,color:ok?"#fff":"#ffffff88"}}>{d.getDate()}</div>})}</div></div>

      </main>
      <BottomNav/>
    </div>
  )
}
