"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG = "https://image.tmdb.org/t/p/w185"

const hojeISO = ()=>new Date().toISOString().slice(0,10)
const ontemISO = ()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }

function calcularStreak(datas){
  if(!datas.length) return { atual:0, quebrado:true }
  const set = new Set(datas)
  const hoje = hojeISO()
  const ontem = ontemISO()
  if(!set.has(hoje) &&!set.has(ontem)) return { atual:0, quebrado:true }
  let atual = 0
  let d = new Date()
  if(!set.has(hoje)) d.setDate(d.getDate()-1)
  while(true){
    const iso = d.toISOString().slice(0,10)
    if(set.has(iso)){ atual++; d.setDate(d.getDate()-1) } else break
  }
  return { atual, quebrado:false }
}

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [fotoOriginal,setFotoOriginal]=useState("")
  const [cks,setCks]=useState([])
  const [streak,setStreak]=useState(0)
  const [streakQuebrado,setStreakQuebrado]=useState(false)
  const [molduraId,setMolduraId]=useState("padrao")
  const [show,setShow]=useState(false)
  const [showFoto,setShowFoto]=useState(false)
  const [buscaFoto,setBuscaFoto]=useState("")
  const [resultFotos,setResultFotos]=useState([])
  const [sugestoes,setSugestoes]=useState([])
  const [stats,setStats]=useState({t:0,m:0,h:0,n:1,xp:0, seriesTotal:0, filmesTotal:0, seriesMaratonadas:0, filmesVistos:0, horasSeries:0, horasFilmes:0})
  const [loading,setLoading]=useState(true)

  // BUSCA PERSONAGENS
  useEffect(()=>{
    if(!showFoto) return
    async function loadSugestoes(){
      try{
        const r = await fetch(`https://api.themoviedb.org/3/trending/person/week?api_key=${TMDB_KEY}&language=pt-BR`).then(x=>x.json())
        setSugestoes(r.results?.slice(0,12) || [])
      }catch{}
    }
    loadSugestoes()
  },[showFoto])

  useEffect(()=>{
    if(!buscaFoto.trim()){ setResultFotos([]); return }
    const t=setTimeout(async()=>{
      try{
        const r=await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(buscaFoto)}&page=1`).then(x=>x.json())
        setResultFotos(r.results?.filter(p=>p.profile_path).slice(0,18) || [])
      }catch{ setResultFotos([]) }
    },400)
    return ()=>clearTimeout(t)
  },[buscaFoto])

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const u=session.user
      setUser(u)
      setNome(u.user_metadata?.full_name || u.email?.split("@")[0] || "Você")
      const avatarGmail = u.user_metadata?.avatar_url || ""
      setFotoOriginal(avatarGmail)
      setFoto(avatarGmail)

      let { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).single()
      if(perfil){
        if(perfil.nome) setNome(perfil.nome)
        if(perfil.moldura) setMolduraId(perfil.moldura)
        if(perfil.avatar_url) setFoto(perfil.avatar_url)
      } else {
        await supabase.from("perfis").insert({ user_id: u.id, nome: u.user_metadata?.full_name, moldura: "padrao", avatar_url: avatarGmail })
      }

      const [
        { data: checkinsData },
        { data: filmes },
        { data: series }
      ] = await Promise.all([
        supabase.from("checkins").select("data").eq("user_id", u.id).order("data",{ascending:true}),
        supabase.from("user_filmes").select("status, runtime, nota").eq("user_id", u.id),
        supabase.from("user_series").select("status, eps_vistos, nota").eq("user_id", u.id)
      ])

      const listaDatas = checkinsData?.map(c=>c.data) || []
      setCks(listaDatas)
      const { atual, quebrado } = calcularStreak(listaDatas)
      setStreak(atual)
      setStreakQuebrado(quebrado && listaDatas.length>0)

      const qtdFilmes = filmes?.length || 0
      const qtdSeries = series?.length || 0
      const filmesVistos = filmes?.filter(f=>f.status==="ja_assisti") || []
      const seriesMaratonadas = series?.filter(s=>s.status==="maratonei") || []
      const maratonados = filmesVistos.length + seriesMaratonadas.length

      let horasFilmes = 0, horasSeries = 0
      filmesVistos.forEach(f=>{ horasFilmes += (f.runtime || 120)/60 })
      series?.forEach(s=>{ const eps = Array.isArray(s.eps_vistos)? s.eps_vistos.length : 0; horasSeries += eps * 0.75 })

      const horas = horasFilmes + horasSeries
      const xp = (listaDatas.length*15) + (maratonados*100) + ((qtdFilmes+qtdSeries)*10) + (atual*5)
      const nivel = Math.max(1, Math.floor(xp/250)+1)
      setStats({
        t:qtdFilmes+qtdSeries, m:maratonados, h:Math.round(horas), n:nivel, xp,
        seriesTotal:qtdSeries, filmesTotal:qtdFilmes,
        seriesMaratonadas:seriesMaratonadas.length, filmesVistos:filmesVistos.length,
        horasSeries:Math.round(horasSeries), horasFilmes:Math.round(horasFilmes)
      })
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

  const escolherFoto = async(url)=>{
    setFoto(url)
    setShowFoto(false)
    const { data:{session} } = await supabase.auth.getSession()
    await supabase.from("perfis").upsert({ user_id: session.user.id, avatar_url: url, moldura: molduraId, nome }, { onConflict:"user_id" })
  }

  const mAtual=getMoldura(molduraId)
  const progresso = (stats.xp%250)/2.5
  const falta = 250-(stats.xp%250)
  const fezHoje = cks.includes(hojeISO())
  const iconeStreak = streak<=1? "🧊" : "🍿"
  const conquistasExibidas = streakQuebrado? 0 : stats.m

  // CALENDÁRIO MÊS ATUAL CORRETO
  const calendario = useMemo(()=>{
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth()
    const primeiroDia = new Date(ano, mes, 1).getDay() // 0 dom
    const diasNoMes = new Date(ano, mes+1, 0).getDate()
    const dias = []
    for(let i=0;i<primeiroDia;i++) dias.push(null)
    for(let d=1; d<=diasNoMes; d++) dias.push(new Date(ano, mes, d))
    return { dias, mesNome: hoje.toLocaleString('pt-BR',{month:'long'}), ano }
  },[cks])

  if(loading) return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando seu perfil...</div>

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b>
        <div style={{display:"flex", gap:8}}>
          <button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙</button>
          <button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button>
        </div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        {/* PERFIL + CHECKIN */}
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <div style={{width:64, height:64, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#000", border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 3px #12182F, 0 0 12px ${mAtual.preview}88`, cursor:"pointer"}} onClick={()=>setShowFoto(true)}>
              {foto? <img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : nome[0]}
            </div>
            <div onClick={()=>setShowFoto(true)} style={{position:"absolute", bottom:-2, right:-2, width:20, height:20, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", fontSize:10, border:"2px solid #12182F", cursor:"pointer"}}>✎</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome}<span style={{fontSize:9, background:streak>1?"#FFD40022":"#38bdf822", color:streak>1?"#FFD400":"#38bdf8", border:"1px solid #ffffff15", padding:"2px 6px", borderRadius:99}}>{iconeStreak} {streak} dias</span></div>
            <div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • {mAtual.nome}</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div>
            <div style={{fontSize:10, opacity:.4, marginTop:4}}>{streakQuebrado? "Sequência reiniciada 🧊" : `Falta ${falta} XP para o nível ${stats.n+1}`}</div>
          </div>
          <button onClick={doCheck} disabled={fezHoje} style={{minWidth:86, height:44, borderRadius:999, border:0, background:fezHoje?"#22c55e":"#FFD400", color:fezHoje?"#fff":"#000", fontWeight:900, cursor:fezHoje?"default":"pointer", fontSize:12, padding:"0 12px"}}>
            {fezHoje? "✓ Feito hoje" : "☑️ Check-in"}
          </button>
        </div>

        {/* MINHA MARATONA */}
        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border: streakQuebrado? "1px solid #38bdf833" : "1px solid #FFD40033", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:14}}>🍿 Minha Maratona</b><span style={{fontSize:11, background:streakQuebrado?"#38bdf822":"#FFD40022", color:streakQuebrado?"#38bdf8":"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #ffffff15"}}>{streakQuebrado? "Recomeço" : `Nível ${stats.n}`}</span></div>
          {streakQuebrado && <div style={{marginTop:10, background:"#38bdf814", border:"1px solid #38bdf822", borderRadius:10, padding:"8px 10px", fontSize:11, lineHeight:1.4}}>🧊 Você perdeu a sequência e suas conquistas foram zeradas. Faça check-in hoje para recomeçar!</div>}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}>
              <div style={{fontSize:11,opacity:.5}}>Sequência atual</div>
              <div style={{fontWeight:800, marginTop:2, fontSize:16}}>{iconeStreak} {streak} {streak===1?"dia":"dias"}</div>
              <div style={{fontSize:10,opacity:.45, marginTop:2}}>{fezHoje? "Volte amanhã" : streak>0? "Faça hoje ou perde!" : "Faça check-in hoje"}</div>
            </div>
            <div style={{background:"#ffffff08", border:"1px solid #ffffff0f", borderRadius:12, padding:10}}>
              <div style={{fontSize:11,opacity:.5}}>Conquistas</div><div style={{fontWeight:800, marginTop:2}}>🏆 {conquistasExibidas}/{Math.max(10,stats.t+5)}</div><div style={{fontSize:10,opacity:.35}}>{streakQuebrado? "Zerado por quebra" : `${stats.xp} XP total`}</div>
            </div>
          </div>
          <div style={{display:"flex", gap:6, marginTop:12, alignItems:"center"}}>
            {Array.from({length:7}).map((_,i)=>{ const ativo = i < Math.min(streak,7); return <div key={i} style={{flex:1, height:6, borderRadius:99, background: ativo? (streak<=1?"#38bdf8":"#FFD400") : "#ffffff15"}}/> })}
            <span style={{fontSize:10, opacity:0.5, marginLeft:4}}>{streak}/7</span>
          </div>
        </div>

        {/* ESTATÍSTICAS SÉRIES E FILMES */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}>
            <div style={{fontSize:11, opacity:0.5}}>📺 Séries</div>
            <div style={{fontSize:22, fontWeight:900, marginTop:2}}>{stats.seriesTotal}</div>
            <div style={{fontSize:11, opacity:0.6, marginTop:4}}>{stats.seriesMaratonadas} maratonadas • {stats.horasSeries}h</div>
          </div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}>
            <div style={{fontSize:11, opacity:0.5}}>🎬 Filmes</div>
            <div style={{fontSize:22, fontWeight:900, marginTop:2}}>{stats.filmesTotal}</div>
            <div style={{fontSize:11, opacity:0.6, marginTop:4}}>{stats.filmesVistos} assistidos • {stats.horasFilmes}h</div>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.t}</div><div style={{fontSize:11,opacity:.45}}>Títulos</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{conquistasExibidas}</div><div style={{fontSize:11,opacity:.45}}>Maratonados</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.h}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div></div>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Loja de Molduras</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ok=stats.n>=m.nivel; const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>{ if(stats.n>=m.nivel) escolher(m.id,m.nivel)}} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",opacity:ok?1:.35,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",display:"grid",placeItems:"center",fontWeight:900,background:m.preview,border:`2px solid ${m.preview}`}}>{nome[0]}</div><div style={{fontSize:11,fontWeight:700,marginTop:6}}>{m.nome}</div><div style={{fontSize:10,opacity:.5}}>Nv {m.nivel}</div></div>})}</div></div>}

        {/* CALENDÁRIO MÊS ATUAL */}
        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}>
            <span>Calendário • {calendario.mesNome} {calendario.ano}</span>
            <span style={{fontSize:11,opacity:.4,fontWeight:400}}>{cks.length} check-ins</span>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6}}>
            {["D","S","T","Q","Q","S","S"].map(d=><div key={d+Math.random()} style={{textAlign:"center", fontSize:10, opacity:0.4, fontWeight:700}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {calendario.dias.map((d,i)=>{
              if(!d) return <div key={i}/>
              const iso=d.toISOString().slice(0,10)
              const ok=cks.includes(iso)
              const hoje=iso===hojeISO()
              return <div key={i} title={iso} style={{aspectRatio:"1",borderRadius:8,background:ok?(streak<=1 && hoje? "#38bdf8" : streak>1? "#FFD400" : "#22c55e"):hoje?"#ffffff22":"#ffffff0e",display:"grid",placeItems:"center",fontSize:12,fontWeight:ok?800:400,color:ok?"#000":"#ffffff88", border: hoje &&!ok? "1px dashed #FFD40088" : "0"}}>{ok? "✓" : d.getDate()}</div>
            })}
          </div>
        </div>
      </main>

      {/* MODAL FOTO PERSONAGEM */}
      {showFoto && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", zIndex:10000, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto", background:"#12182F", border:"1px solid #ffffff18", borderRadius:18, padding:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b>Trocar foto • Personagens</b>
              <button onClick={()=>setShowFoto(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{display:"flex", gap:8, marginBottom:12}}>
              <button onClick={()=>escolherFoto(fotoOriginal)} style={{flex:1, padding:10, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:12, fontWeight:700}}>Foto do Gmail</button>
              <button onClick={()=>escolherFoto("")} style={{flex:1, padding:10, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:12}}>Inicial</button>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, background:"#0E1430", border:"1px solid #ffffff12", height:42, borderRadius:999, padding:"0 14px", marginBottom:12}}>
              <span style={{opacity:0.5}}>🔍</span>
              <input value={buscaFoto} onChange={e=>setBuscaFoto(e.target.value)} placeholder="Buscar personagem: Harry Potter, Homem Aranha..." style={{flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13}} />
            </div>
            <div style={{fontSize:11, opacity:0.5, marginBottom:8}}>{buscaFoto? `${resultFotos.length} resultados` : "Sugestões populares"}</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {(buscaFoto? resultFotos : sugestoes).map(p=>(
                <div key={p.id} onClick={()=>escolherFoto(`https://image.tmdb.org/t/p/w185${p.profile_path}`)} style={{cursor:"pointer", textAlign:"center"}}>
                  <div style={{width:"100%", aspectRatio:"1", borderRadius:999, overflow:"hidden", background:"#0A0F2A", border:"1px solid #ffffff15"}}>
                    <img src={`${TMDB_IMG}${p.profile_path}`} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  </div>
                  <div style={{fontSize:10, marginTop:6, fontWeight:700, lineHeight:1.2}}>{p.name}</div>
                  <div style={{fontSize:9, opacity:0.5}}>{(p.known_for?.[0]?.title || p.known_for?.[0]?.name || "").slice(0,18)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
