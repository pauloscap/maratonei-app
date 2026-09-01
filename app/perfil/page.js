"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG_BIG = "https://image.tmdb.org/t/p/w500"

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

const CONQUISTAS = [
  { id:1, nome:"Pipoquinha", emoji:"🍿", min:1, max:7 },
  { id:2, nome:"Pipoca Média", emoji:"🍿", min:8, max:14 },
  { id:3, nome:"Baldão", emoji:"🪣", min:15, max:21 },
  { id:4, nome:"Ticket", emoji:"🎟️", min:22, max:28 },
  { id:5, nome:"Óculos 3D", emoji:"🕶️", min:29, max:35 },
  { id:6, nome:"Claquete", emoji:"🎬", min:36, max:42 },
  { id:7, nome:"Câmera", emoji:"🎥", min:43, max:49 },
  { id:8, nome:"Troféu", emoji:"🏆", min:50, max:56 },
  { id:9, nome:"Coroa", emoji:"👑", min:57, max:999 },
]

const PERSONAGENS_EMOJI = [
  { nome:"Wandinha", emoji:"🖤", cor:"#1a1a1a" },
  { nome:"Harry Potter", emoji:"⚡", cor:"#7a0000" },
  { nome:"Stitch", emoji:"👽", cor:"#2a7fff" },
  { nome:"Homem-Aranha", emoji:"🕷️", cor:"#b00000" },
  { nome:"Barbie", emoji:"💖", cor:"#ff69b4" },
  { nome:"Naruto", emoji:"🍥", cor:"#ff8c00" },
  { nome:"Luffy", emoji:"👒", cor:"#d00000" },
  { nome:"Pikachu", emoji:"⚡", cor:"#ffcc00" },
  { nome:"Batman", emoji:"🦇", cor:"#111111" },
  { nome:"Deadpool", emoji:"🗡️", cor:"#a00000" },
  { nome:"Grogu", emoji:"👶", cor:"#7ab000" },
  { nome:"Eleven", emoji:"🧇", cor:"#e00000" },
]

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [fotoOriginal,setFotoOriginal]=useState("")
  const [avatarEmoji,setAvatarEmoji]=useState(null)
  const [cks,setCks]=useState([])
  const [streak,setStreak]=useState(0)
  const [streakQuebrado,setStreakQuebrado]=useState(false)
  const [showFoto,setShowFoto]=useState(false)
  const [showPuzzle,setShowPuzzle]=useState(false)
  const [posterReacher,setPosterReacher]=useState("")
  const [stats,setStats]=useState({t:0,n:1,xp:0, seriesTotal:0, filmesTotal:0, seriesMaratonadas:0, filmesVistos:0, horasSeries:0, horasFilmes:0})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function loadPoster(){
      try{
        const r = await fetch(`https://api.themoviedb.org/3/tv/89844?api_key=${TMDB_KEY}&language=pt-BR`).then(x=>x.json())
        if(r?.poster_path) setPosterReacher(`${TMDB_IMG_BIG}${r.poster_path}`)
      }catch{}
    }
    loadPoster()
  },[])

  useEffect(()=>{
    const loadData = async ()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const u=session.user
      setUser(u)
      setNome(u.user_metadata?.full_name || u.email?.split("@")[0] || "Você")
      const avatarGmail = u.user_metadata?.avatar_url || ""
      setFotoOriginal(avatarGmail)
      setFoto(avatarGmail)
      const savedEmoji = localStorage.getItem(u.id+":avatar_emoji")
      if(savedEmoji) setAvatarEmoji(JSON.parse(savedEmoji))
      let { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).single()
      if(perfil){ if(perfil.nome) setNome(perfil.nome); if(perfil.avatar_url && perfil.avatar_url.startsWith("http")) setFoto(perfil.avatar_url) }
      const [ { data: checkinsData }, { data: filmes }, { data: series } ] = await Promise.all([
        supabase.from("checkins").select("data").eq("user_id", u.id).order("data",{ascending:true}),
        supabase.from("user_filmes").select("status, runtime").eq("user_id", u.id),
        supabase.from("user_series").select("status, eps_vistos").eq("user_id", u.id)
      ])
      const listaDatas = checkinsData?.map(c=>c.data) || []
      setCks(listaDatas)
      const { atual, quebrado } = calcularStreak(listaDatas)
      setStreak(atual); setStreakQuebrado(quebrado && listaDatas.length>0)
      const qtdFilmes = filmes?.length || 0
      const qtdSeries = series?.length || 0
      const filmesVistos = filmes?.filter(f=>f.status==="ja_assisti") || []
      const seriesMaratonadas = series?.filter(s=>s.status==="maratonei") || []
      let horasFilmes=0, horasSeries=0
      filmesVistos.forEach(f=>{ horasFilmes += (f.runtime || 120)/60 })
      series?.forEach(s=>{ const eps = Array.isArray(s.eps_vistos)? s.eps_vistos.length : 0; horasSeries += eps * 0.75 })
      const maratonados = filmesVistos.length + seriesMaratonadas.length
      const xp = (listaDatas.length*15) + (maratonados*100) + ((qtdFilmes+qtdSeries)*10) + (atual*5)
      const nivel = Math.max(1, Math.floor(xp/250)+1)
      setStats({ t:qtdFilmes+qtdSeries, n:nivel, xp, seriesTotal:qtdSeries, filmesTotal:qtdFilmes, seriesMaratonadas:seriesMaratonadas.length, filmesVistos:filmesVistos.length, horasSeries:Math.round(horasSeries), horasFilmes:Math.round(horasFilmes) })
      setLoading(false)
    }
    loadData()
  },[])

  const doCheck = async()=>{
    const h=hojeISO(); if(cks.includes(h)) return
    const { data:{session} } = await supabase.auth.getSession()
    const { error } = await supabase.from("checkins").insert({ user_id: session.user.id, data: h })
    if(!error){ const novo=[...cks,h].sort(); setCks(novo); const { atual } = calcularStreak(novo); setStreak(atual); setStreakQuebrado(false); setStats(s=>{ const xp=s.xp+20; return {...s, n:Math.floor(xp/250)+1, xp} }) }
  }

  const escolherEmoji = async(item)=>{
    setAvatarEmoji(item)
    setFoto("")
    setShowFoto(false)
    localStorage.setItem(user.id+":avatar_emoji", JSON.stringify(item))
    const { data:{session} } = await supabase.auth.getSession()
    await supabase.from("perfis").upsert({ user_id: session.user.id, avatar_url: `emoji:${item.nome}`, nome }, { onConflict:"user_id" })
  }

  const progresso = (stats.xp%250)/2.5
  const fezHoje = cks.includes(hojeISO())
  const iconesDesbloqueados = streakQuebrado? 0 : CONQUISTAS.filter(c=> streak>=c.min).length
  const pecasDesbloqueadas = Math.min(30, cks.length)
  const conquistaAtual = streakQuebrado? null : CONQUISTAS.find(c=> streak>=c.min && streak<=c.max)

  const calendario = useMemo(()=>{
    const hoje = new Date(); const ano=hoje.getFullYear(); const mes=hoje.getMonth()
    const primeiroDia=new Date(ano,mes,1).getDay(); const diasNoMes=new Date(ano,mes+1,0).getDate()
    const dias=[]; for(let i=0;i<primeiroDia;i++) dias.push(null); for(let d=1; d<=diasNoMes; d++) dias.push(new Date(ano,mes,d))
    return { dias, mesNome: hoje.toLocaleString('pt-BR',{month:'long'}), ano }
  },[cks])

  if(loading) return <div style={{minHeight:"100vh", background:"#080B1F", display:"grid", placeItems:"center", color:"#fff"}}>Carregando seu perfil...</div>

  return(
    <div style={{minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90}}>
      <header style={{height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #ffffff0f", background:"#080B1F", position:"sticky", top:0, zIndex:10}}>
        <b>Perfil</b>
        <div style={{display:"flex", gap:8}}>
          <button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙</button>
          <button onClick={()=>setShowPuzzle(true)} style={{background:"#FFD400", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:900, fontSize:12}}>🧩 Desafio Setembro</button>
        </div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <div onClick={()=>setShowFoto(true)} style={{width:68, height:68, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", background: avatarEmoji? avatarEmoji.cor : "#1a1a1a", border:`2px solid #FFD400`, cursor:"pointer", fontSize:32}}>
              {avatarEmoji? avatarEmoji.emoji : foto? <img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : nome[0]}
            </div>
            <div onClick={()=>setShowFoto(true)} style={{position:"absolute", bottom:-2, right:-2, width:22, height:22, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", fontSize:10, border:"2px solid #12182F", cursor:"pointer", color:"#000"}}>✎</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome} <span style={{fontSize:9, background:streak>1?"#FFD40022":"#38bdf822", color:streak>1?"#FFD400":"#38bdf8", border:"1px solid #ffffff15", padding:"2px 6px", borderRadius:99}}>{streak>0? "🍿" : "🧊"} {streak} dias</span></div>
            <div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {conquistaAtual? conquistaAtual.emoji+" "+conquistaAtual.nome : "Sem conquista"} • {pecasDesbloqueadas}/30 peças</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div>
          </div>
          <button onClick={doCheck} disabled={fezHoje} style={{minWidth:96, height:44, borderRadius:999, border:0, background:fezHoje?"#22c55e":"#FFD400", color:fezHoje?"#fff":"#000", fontWeight:900, cursor:fezHoje?"default":"pointer", fontSize:12}}>{fezHoje? "✓ Hoje" : "☑ Check-in"}</button>
        </div>

        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border: streakQuebrado? "1px solid #38bdf833" : "1px solid #FFD40033", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:14}}>🍿 Minha Maratona</b><span style={{fontSize:11, background:streakQuebrado?"#38bdf822":"#FFD40022", color:streakQuebrado?"#38bdf8":"#FFD400", padding:"3px 8px", borderRadius:99}}>{streakQuebrado? "Zerado" : `${iconesDesbloqueados}/9 ícones`}</span></div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:12}}>
            {CONQUISTAS.map(c=>{ const desbloq = streak>=c.min &&!streakQuebrado; return (
              <div key={c.id} style={{background: desbloq? "#FFD40014" : "#ffffff06", border: desbloq? "1px solid #FFD40044" : "1px solid #ffffff10", borderRadius:12, padding:10, textAlign:"center", opacity: desbloq? 1 : 0.35}}>
                <div style={{fontSize:22}}>{c.emoji}</div>
                <div style={{fontSize:10, fontWeight:800, marginTop:4}}>{c.nome}</div>
              </div>
            )})}
          </div>
          <div onClick={()=>setShowPuzzle(true)} style={{marginTop:12, background:"#FFD400", color:"#000", borderRadius:10, padding:"8px 10px", fontSize:11, textAlign:"center", fontWeight:900, cursor:"pointer"}}>🧩 Ver quebra-cabeça • {pecasDesbloqueadas}/30 peças</div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}><div style={{fontSize:11, opacity:0.5}}>📺 Séries</div><div style={{fontSize:22, fontWeight:900}}>{stats.seriesTotal}</div><div style={{fontSize:11, opacity:0.6}}>{stats.seriesMaratonadas} maratonadas • {stats.horasSeries}h</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14}}><div style={{fontSize:11, opacity:0.5}}>🎬 Filmes</div><div style={{fontSize:22, fontWeight:900}}>{stats.filmesTotal}</div><div style={{fontSize:11, opacity:0.6}}>{stats.filmesVistos} assistidos • {stats.horasFilmes}h</div></div>
        </div>

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}><span>Calendário • {calendario.mesNome} {calendario.ano}</span><span style={{fontSize:11,opacity:.4}}>{cks.length} check-ins</span></div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6}}>{["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center", fontSize:10, opacity:0.4, fontWeight:700}}>{d}</div>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {calendario.dias.map((d,i)=>{ if(!d) return <div key={i}/>; const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO(); return <div key={i} style={{aspectRatio:"1",borderRadius:8,background:ok?"#FFD400":hoje?"#ffffff22":"#ffffff0e",display:"grid",placeItems:"center",fontSize:12,fontWeight:ok?800:400,color:ok?"#000":"#ffffff88", border: hoje &&!ok? "1px dashed #FFD40088" : "0"}}>{ok? "✓" : d.getDate()}</div> })}
          </div>
        </div>
      </main>

      {showFoto && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:10000, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto", background:"#12182F", border:"1px solid #ffffff18", borderRadius:18, padding:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b>Escolha seu personagem</b>
              <button onClick={()=>setShowFoto(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <button onClick={()=>{ setAvatarEmoji(null); setFoto(fotoOriginal); setShowFoto(false); localStorage.removeItem(user.id+":avatar_emoji"); supabase.from("perfis").upsert({ user_id:user.id, avatar_url:fotoOriginal, nome }, {onConflict:"user_id"}) }} style={{width:"100%", padding:12, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:13, fontWeight:700, marginBottom:14}}>Foto do Gmail</button>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {PERSONAGENS_EMOJI.map(p=>(
                <div key={p.nome} onClick={()=>escolherEmoji(p)} style={{cursor:"pointer", aspectRatio:"1", borderRadius:14, overflow:"hidden", background:p.cor, border:"1px solid #ffffff15", display:"grid", placeItems:"center", fontSize:36}}>
                  {p.emoji}
                </div>
              ))}
            </div>
            <div style={{fontSize:11, opacity:0.5, marginTop:14, textAlign:"center"}}>toque para escolher a foto do seu perfil</div>
          </div>
        </div>
      )}

      {showPuzzle && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:10001, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b style={{fontSize:16}}>Desafio de setembro</b>
              <button onClick={()=>setShowPuzzle(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12, marginBottom:12}}>
              <div style={{fontSize:12, lineHeight:1.5, fontWeight:700}}>Desafio de setembro</div>
              <div style={{fontSize:12, lineHeight:1.5, marginTop:4}}>Série do mês. Complete os check-ins diários para liberar as peças e descobrir qual é a série do mês. Cada check-in = 1 peça do quebra-cabeça.</div>
              <div style={{marginTop:10, display:"flex", gap:8, alignItems:"center"}}>
                {posterReacher && <img src={posterReacher} alt="Reacher" style={{width:56, height:84, borderRadius:8, objectFit:"cover", border:"1px solid #ffffff15"}} />}
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:900}}>Reacher • Cartaz oficial Prime Video</div>
                  <div style={{fontSize:11, opacity:0.6, marginTop:2}}>Série do mês de setembro • 30 peças para liberar</div>
                  <div style={{marginTop:8, height:6, background:"#ffffff14", borderRadius:99, overflow:"hidden"}}><div style={{width:`${(pecasDesbloqueadas/30)*100}%`, height:"100%", background:"#FFD400"}}/></div>
                  <div style={{fontSize:10, opacity:0.5, marginTop:4}}>{pecasDesbloqueadas}/30 peças • {cks.length} check-ins</div>
                </div>
              </div>
            </div>
            <div style={{background:"#000", borderRadius:16, overflow:"hidden", border:"1px solid #ffffff15"}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:2, background:"#000", padding:2}}>
                {Array.from({length:30}).map((_,i)=>{
                  const liberada = i < pecasDesbloqueadas
                  return (
                    <div key={i} style={{aspectRatio:"3/4", position:"relative", overflow:"hidden", background:"#111", borderRadius:4}}>
                      {posterReacher && <img src={posterReacher} alt="" style={{width:"500%", height:"600%", objectFit:"cover", position:"absolute", left:`-${(i%5)*100}%`, top:`-${Math.floor(i/5)*100}%`, filter: liberada? "none" : "blur(14px) brightness(0.25)"}} />}
                      {!liberada && <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", fontSize:16, background:"rgba(0,0,0,0.5)"}}>🔒</div>}
                    </div>
                  )
                })}
              </div>
            </div>
            {pecasDesbloqueadas===30 && <div style={{marginTop:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"12px", textAlign:"center", fontWeight:900}}>🎉 Você completou o cartaz de Reacher! Desafio de Setembro concluído!</div>}
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
