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
  const [stats,setStats]=useState({t:10,m:2,h:194,n:12,xp:2885})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    ;(async()=>{
      try{
        const { data:{session} } = await supabase.auth.getSession()
        if(!session){ setLoading(false); return }
        const u=session.user
        setUser(u)
        setNome(u.user_metadata?.full_name || localStorage.getItem("perfil-nome") || "Paulo Rodrigo Garcia")
        setFoto(u.user_metadata?.avatar_url || "")

        // tenta buscar do supabase, se tabela não existir cai no catch
        try{
          const { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).maybeSingle()
          if(perfil?.moldura) setMolduraId(perfil.moldura)
          const { data: chk } = await supabase.from("checkins").select("data").eq("user_id", u.id)
          if(chk && chk.length>0){ setCks(chk.map(c=>c.data)) }
          else { const c=JSON.parse(localStorage.getItem("checkins")||"[]"); setCks(c) }
        }catch(e){
          const c=JSON.parse(localStorage.getItem("checkins")||"[]"); setCks(c)
          setMolduraId(localStorage.getItem("perfil-moldura")||"padrao")
        }
      }finally{ setLoading(false) }
    })()
  },[])

  const doCheck = async()=>{
    const h=hojeISO()
    if(cks.includes(h)) return
    try{
      const { data:{session} } = await supabase.auth.getSession()
      if(session?.user){
        const { error } = await supabase.from("checkins").insert({ user_id: session.user.id, data: h })
        if(error) throw error
      }
    }catch(e){ /* se tabela não existe salva local */ }
    const novo=[...cks,h]
    localStorage.setItem("checkins", JSON.stringify(novo))
    setCks(novo)
  }

  const escolher = async(id,nv)=>{
    if(stats.n < nv) return alert("Nível "+nv)
    setMolduraId(id); setShow(false)
    localStorage.setItem("perfil-moldura", id)
    try{
      const { data:{session} } = await supabase.auth.getSession()
      if(session?.user) await supabase.from("perfis").upsert({ user_id: session.user.id, moldura: id, nome })
    }catch(e){}
  }

  const mAtual=getMoldura(molduraId)
  const dias=Array.from({length:30},(_,i)=>{const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d})
  const progresso=(stats.xp%250)/2.5
  const falta=250-(stats.xp%250)

  if(loading) return <div style={{minHeight:"100vh",background:"#080B1F",display:"grid",placeItems:"center",color:"#fff"}}>Carregando...</div>

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b><div style={{display:"flex", gap:8}}><button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙️</button><button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button></div>
      </header>
      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{width:56, height:56, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#000", border:`2px solid ${mAtual.preview}`}}>{foto?<img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:nome[0]}</div>
          <div style={{flex:1}}><div style={{fontWeight:900, fontSize:15}}>{nome}</div><div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • 🔥 {cks.length||1} dias • {mAtual.nome}</div><div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"#FFD400"}}/></div><div style={{fontSize:10, opacity:.4, marginTop:4}}>Falta {falta} XP para o nível {stats.n+1}</div></div>
          <button onClick={doCheck} style={{width:40,height:40,borderRadius:999,border:0,background:cks.includes(hojeISO())?"#22c55e":"#FFD400",color:"#000",fontWeight:900}}>✓</button>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.t}</div><div style={{fontSize:11,opacity:.45}}>Títulos</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11,opacity:.45}}>Maratonadas</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div></div>
        </div>
        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}><div><div style={{fontWeight:800,fontSize:13}}>🎮 Gamificação • Nível {stats.n}</div><div style={{fontSize:11,opacity:.5}}>🔥 {cks.length} dias • 🏆 7/24 conquistas</div></div><div onClick={()=>location.href="/ranking"} style={{background:"#FFD40018", border:"1px solid #FFD40030", padding:"6px 10px", borderRadius:99, fontSize:11, fontWeight:800, cursor:"pointer"}}>🏆 Ranking</div></div>
        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>escolher(m.id,m.nivel)} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",background:m.preview}}/><div style={{fontSize:11,marginTop:6}}>{m.nome}</div></div>})}</div></div>}
        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Calendário • 30 dias</div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:6}}>{dias.map((d,i)=>{const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); return <div key={i} style={{aspectRatio:"1",borderRadius:8,background:ok?"#22c55e":"#ffffff0e",display:"grid",placeItems:"center",fontSize:11}}>{d.getDate()}</div>})}</div></div>
      </main>
      <BottomNav/>
    </div>
  )
}
