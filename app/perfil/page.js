"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const hojeISO = ()=>new Date().toISOString().slice(0,10)
const ontemISO = ()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [cks,setCks]=useState([])
  const [streak,setStreak]=useState(0)
  const [streakQuebrado,setStreakQuebrado]=useState(false)
  const [molduraId,setMolduraId]=useState("padrao")
  const [show,setShow]=useState(false)
  const [stats,setStats]=useState({t:0,m:0,h:0,n:1,xp:0})
  const [loading,setLoading]=useState(true)

  function calcularStreak(datas){
    if(!datas.length) return { atual:0, quebrado:true }
    const set = new Set(datas)
    const hoje = hojeISO()
    const ontem = ontemISO()
    // se não fez hoje nem ontem, quebrou
    if(!set.has(hoje) &&!set.has(ontem)) return { atual:0, quebrado:true }
    let atual = 0
    let d = new Date()
    // se não fez hoje, começa a contar de ontem pra mostrar que ainda pode salvar
    if(!set.has(hoje)) d.setDate(d.getDate()-1)
    while(true){
      const iso = d.toISOString().slice(0,10)
      if(set.has(iso)){ atual++; d.setDate(d.getDate()-1) } else break
    }
    return { atual, quebrado:false }
  }

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const u=session.user
      setUser(u)
      setNome(u.user_metadata?.full_name || u.email?.split("@")[0] || "Você")
      setFoto(u.user_metadata?.avatar_url || "")

      let { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).single()
      if(perfil){ if(perfil.nome) setNome(perfil.nome); if(perfil.moldura) setMolduraId(perfil.moldura) }
      else { await supabase.from("perfis").insert({ user_id: u.id, nome: u.user_metadata?.full_name, moldura: "padrao" }) }

      const [{ data: checkinsData }, { data: filmes }, { data: series }] = await Promise.all([
        supabase.from("checkins").select("data").eq("user_id", u.id).order("data",{ascending:true}),
        supabase.from("user_filmes").select("status").eq("user_id", u.id),
        supabase.from("user_series").select("status, episodios_assistidos").eq("user_id", u.id)
      ])

      const listaDatas = checkinsData?.map(c=>c.data) || []
      setCks(listaDatas)
      const { atual, quebrado } = calcularStreak(listaDatas)
      setStreak(atual)
      setStreakQuebrado(quebrado && listaDatas.length>0)

      const qtdFilmes = filmes?.length || 0
      const qtdSeries = series?.length || 0
      const maratonados = (filmes?.filter(f=>f.status==="ja_assisti").length||0) + (series?.filter(s=>s.status==="ja_assisti"||s.status==="maratonei").length||0)
      const totalTitulos = qtdFilmes + qtdSeries
      let horas = (filmes?.filter(f=>f.status==="ja_assisti").length||0)*2
      series?.forEach(s=>{ if(s.status==="ja_assisti"||s.status==="maratonei") horas+=10; else if(s.episodios_assistidos) horas+=s.episodios_assistidos*0.7 })
      const xp = (listaDatas.length*15) + (maratonados*100) + (totalTitulos*10) + (atual*5)
      const nivel = Math.max(1, Math.floor(xp/250)+1)
      setStats({t:totalTitulos,m:maratonados,h:Math.round(horas),n:nivel,xp})
      setLoading(false)
    })()
  },[])

  const doCheck = async()=>{
    const h=hojeISO()
    if(cks.includes(h)) return
    const { data:{session} } = await supabase.auth.getSession()
    const { error } = await supabase.from("checkins").insert({ user_id: session.user.id, data: h })
    if(!error){
      const novo=[...cks,h].sort()
      setCks(novo)
      const { atual } = calcularStreak(novo)
      setStreak(atual); setStreakQuebrado(false)
      setStats(s=>{ const xp=s.xp+15+5; return {...s, n:Math.floor(xp/250)+1, xp} })
    }
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
  const fezHoje = cks.includes(hojeISO())
  const iconeStreak = streak<=1? "🧊" : "🍿"

  if(loading) return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando seu perfil...</div>

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b><div style={{display:"flex", gap:8}}><button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙</button><button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button></div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{width:56, height:56, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#000", border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 3px #12182F, 0 0 12px ${mAtual.preview}88`}}>{foto?<img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:nome[0]}</div>
          <div style={{flex:1}}><div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome}<span style={{fontSize:9, background:streak>1?"#FFD40022":"#38bdf822", color:streak>1?"#FFD400":"#38bdf8", border:"1px solid #ffffff15", padding:"2px 6px", borderRadius:99}}>{iconeStreak} {streak} dias</span></div><div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • {iconeStreak} {streak} dias • {mAtual.nome}</div><div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div><div style={{fontSize:10, opacity:.4, marginTop:4}}>{streakQuebrado? "Sequência reiniciada 🧊" : `Falta ${falta} XP para o nível ${stats.n+1}`}</div></div>
          <button onClick={doCheck} style={{width:44,height:44,borderRadius:999,border:0,background:fezHoje?"#22c55e":"#FFD400",color:fezHoje?"#fff":"#000",fontWeight:900, cursor:"pointer", fontSize:16}}>{fezHoje?"✓":iconeStreak}</button>
        </div>

        {/* GAMIFICAÇÃO ATUALIZADA */}
        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border: streakQuebrado? "1px solid #38bdf833" : "1px solid #FFD40033", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:13}}>{iconeStreak} Gamificação</b><span style={{fontSize:11, background:streakQuebrado?"#38bdf822":"#FFD40022", color:streakQuebrado?"#38bdf8":"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #ffffff15"}}>{streakQuebrado? "Recomeço" : `Nível ${stats.n}`}</span></div>

          {streakQuebrado && <div style={{marginTop:10, background:"#38bdf814", border:"1px solid #38bdf822", borderRadius:10, padding:"8px 10px", fontSize:11, lineHeight:1.4}}>🧊 Você perdeu a sequência por não fazer check-in. Comece de novo hoje para transformar o gelo em 🍿</div>}

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}>
              <div style={{fontSize:11,opacity:.5}}>Sequência atual</div>
              <div style={{fontWeight:800, marginTop:2, fontSize:16}}>{iconeStreak} {streak} {streak===1?"dia":"dias"}</div>
              <div style={{fontSize:10,opacity:.45, marginTop:2}}>{fezHoje? "Volte amanhã" : streak>0? "Faça hoje ou perde!" : "Faça check-in hoje"}</div>
            </div>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}>
              <div style={{fontSize:11,opacity:.5}}>Conquistas</div><div style={{fontWeight:800, marginTop:2}}>🏆 {stats.m}/{Math.max(10,stats.t+5)}</div><div style={{fontSize:10,opacity:.35}}>{stats.xp} XP total</div>
            </div>
          </div>

          <div style={{display:"flex", gap:6, marginTop:12, alignItems:"center"}}>
            {Array.from({length:7}).map((_,i)=>{
              const ativo = i < Math.min(streak,7)
              return <div key={i} style={{flex:1, height:6, borderRadius:99, background: ativo? (streak<=1?"#38bdf8":"#FFD400") : "#ffffff15"}}/>
            })}
            <span style={{fontSize:10, opacity:0.5, marginLeft:4}}>{streak}/7</span>
          </div>
          <div style={{fontSize:10, opacity:.35, marginTop:6, textAlign:"center"}}>{streak>=7? "🍿 Maratonista em chamas! +50 XP bônus" : streak>1? `Faltam ${7-streak} dias para bônus semanal` : "2 dias seguidos = pipoca, 7 dias = bônus"}</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.t}</div><div style={{fontSize:11,opacity:.45}}>Títulos</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{stats.m}</div><div style={{fontSize:11,opacity:.45}}>Maratonados</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div></div>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Loja de Molduras</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ok=stats.n>=m.nivel; const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>{ if(stats.n>=m.nivel) escolher(m.id,m.nivel)}} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",opacity:ok?1:.35,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",display:"grid",placeItems:"center",fontWeight:900,background:m.preview,border:`2px solid ${m.preview}`}}>{nome[0]}</div><div style={{fontSize:11,fontWeight:700,marginTop:6}}>{m.nome}</div><div style={{fontSize:10,opacity:.5}}>Nv {m.nivel}</div></div>})}</div></div>}

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}><div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>Calendário • 30 dias</span><span style={{fontSize:11,opacity:.4,fontWeight:400}}>{cks.length} check-ins</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:6}}>{dias.map((d,i)=>{const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO(); return <div key={i} title={iso} style={{aspectRatio:"1",borderRadius:8,background:ok?(streak<=1 && hoje? "#38bdf8" : streak>1? "#FFD400" : "#22c55e"):hoje?"#ffffff22":"#ffffff0e",display:"grid",placeItems:"center",fontSize:11,fontWeight:ok?800:400,color:ok?"#000":"#ffffff88", border: hoje &&!ok? "1px dashed #FFD40088" : "0"}}>{ok? (streak<=1?"🧊":"🍿") : d.getDate()}</div>})}</div></div>

      </main>
      <BottomNav/>
    </div>
  )
}
