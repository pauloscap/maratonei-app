"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const hojeISO = ()=>new Date().toISOString().slice(0,10)

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [cks,setCks]=useState([])
  const [molduraId,setMolduraId]=useState("padrao")
  const [show,setShow]=useState(false)
  const [stats,setStats]=useState({t:10,m:2,h:194,n:12,xp:2885})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const u=session.user
      setUser(u)
      setNome(u.user_metadata?.full_name || u.email?.split("@")[0] || "Você")
      setFoto(u.user_metadata?.avatar_url || "")

      // 1. Busca perfil do usuário (moldura e nome salvo na nuvem)
      const { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).single()
      if(perfil){
        if(perfil.nome) setNome(perfil.nome)
        if(perfil.moldura) setMolduraId(perfil.moldura)
      } else {
        // cria perfil na primeira vez
        await supabase.from("perfis").insert({ user_id: u.id, nome: u.user_metadata?.full_name, moldura: "padrao" })
      }

      // 2. Busca checkins SÓ DESSE USUÁRIO
      const { data: checkinsData } = await supabase.from("checkins").select("data").eq("user_id", u.id)
      const listaDatas = checkinsData?.map(c=>c.data) || []
      setCks(listaDatas)

      // 3. Calcula stats (você pode trocar depois por tabela de progresso)
      let mc=2
      // tenta pegar local antigo só para migrar uma vez, depois ignora
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k?.includes("status-")&&localStorage.getItem(k)=="ja_assisti") mc++ }
      const xp = 2000 + listaDatas.length*15 + mc*50
      const nivel = Math.max(12, Math.floor(xp/250)+1)
      setStats({t:10,m:mc,h:194,n:nivel,xp})
      setLoading(false)
    })()
  },[])

  const doCheck = async()=>{
    const h=hojeISO()
    if(cks.includes(h)) return
    const { data:{session} } = await supabase.auth.getSession()
    const { error } = await supabase.from("checkins").insert({ user_id: session.user.id, data: h })
    if(!error){ setCks([...cks,h]) } else { alert("Você já fez check-in hoje") }
  }

  const escolher = async(id,nv)=>{
    if(stats.n < nv) return alert("Chegue no nível "+nv+" para desbloquear")
    const { data:{session} } = await supabase.auth.getSession()
    await supabase.from("perfis").update({ moldura: id }).eq("user_id", session.user.id)
    setMolduraId(id); setShow(false)
  }

  const mAtual=getMoldura(molduraId)
  const dias=Array.from({length:30},(_,i)=>{const d=new Date(); d.setDate(new Date().getDate()-(29-i)); return d})
  const progresso = (stats.xp%250)/2.5
  const falta = 250-(stats.xp%250)

  if(loading) return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando seu perfil...</div>

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b><div style={{display:"flex", gap:8}}><button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙️</button><button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button></div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{width:56, height:56, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#000", border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 3px #12182F, 0 0 12px ${mAtual.preview}88`}}>{foto?<img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:nome[0]}</div>
          <div style={{flex:1}}><div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome}<span style={{fontSize:9, background:"#22c55e22", color:"#22c55e", border:"1px solid #22c55e33", padding:"2px 6px", borderRadius:99}}>Google</span></div><div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • 🔥 {cks.length||1} dias • {mAtual.nome}</div><div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div><div style={{fontSize:10, opacity:.4, marginTop:4}}>Falta {falta} XP para o nível {stats.n+1}</div></div>
          <button onClick={doCheck} style={{width:40,height:40,borderRadius:999,border:0,background:cks.includes(hojeISO())?"#22c55e":"#FFD400",color:cks.includes(hojeISO())?"#fff":"#000",fontWeight:900, cursor:"pointer"}}>✓</button>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.t}</div><div style={{fontSize:11,opacity:.45}}>Títulos</div><div style={{fontSize:10, color:"#22c55e", marginTop:2}}>+2 essa semana</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11,opacity:.45}}>Maratonadas</div><div style={{fontSize:10, color:"#FFD400", marginTop:2}}>Top 15%</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div><div style={{fontSize:10, opacity:.4, marginTop:2}}>~8 dias</div></div>
        </div>

        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border:"1px solid #FFD40022", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:13}}>🎮 Gamificação</b><span style={{fontSize:11, background:"#FFD40022", color:"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #FFD40033"}}>Nível {stats.n}</span></div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}><div style={{fontSize:11,opacity:.5}}>Sequência</div><div style={{fontWeight:800, marginTop:2}}>🔥 {cks.length} dias</div><div style={{fontSize:10,opacity:.35}}>Recorde: 12 dias</div></div>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}><div style={{fontSize:11,opacity:.5}}>Conquistas</div><div style={{fontWeight:800, marginTop:2}}>🏆 7/24</div><div style={{fontSize:10,opacity:.35}}>3 lendárias</div></div>
          </div>
          <div style={{display:"flex", gap:6, marginTop:10}}>{["🔥","⭐","🎬","📺","🏆","💎"].map((e,i)=><div key={i} style={{width:32,height:32,borderRadius:8,background:i<4?"#FFD400":"#ffffff12",display:"grid",placeItems:"center",fontSize:14,opacity:i<4?1:.4}}>{e}</div>)}</div>
        </div>

        <div onClick={()=>location.href="/ranking"} style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:12, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"#FFD40018",border:"1px solid #FFD40030",display:"grid",placeItems:"center"}}>🏆</div><div><div style={{fontWeight:800,fontSize:13}}>Ranking Global</div><div style={{fontSize:11,opacity:.45}}>Você está em #12 • Suba 3 posições</div></div></div><div style={{opacity:.3}}>›</div>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Loja de Molduras</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ok=stats.n>=m.nivel; const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>escolher(m.id,m.nivel)} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",opacity:ok?1:.35,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",display:"grid",placeItems:"center",fontWeight:900,background:m.preview,border:`2px solid ${m.preview}`}}>{nome[0]}</div><div style={{fontSize:11,fontWeight:700,marginTop:6}}>{m.nome}</div><div style={{fontSize:10,opacity:.5}}>Nv {m.nivel}</div></div>})}</div></div>}

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}><div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>Calendário • 30 dias</span><span style={{fontSize:11,opacity:.4,fontWeight:400}}>{cks.length} check-ins</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:6}}>{dias.map((d,i)=>{const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO(); return <div key={i} style={{aspectRatio:"1",borderRadius:8,background:ok?"#22c55e":hoje?"#ffffff18":"#ffffff0e",display:"grid",placeItems:"center",fontSize:11,fontWeight:ok?800:400,color:ok?"#fff":"#ffffff88"}}>{d.getDate()}</div>})}</div></div>

      </main>
      <BottomNav/>
    </div>
  )
}
