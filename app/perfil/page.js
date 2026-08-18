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

// FOTO REAL DO PERSONAGEM (não do ator) - estilo Netflix
const PERSONAGENS_REAIS = [
  { nome:"Wandinha Addams", serie:"Wandinha", img:"https://upload.wikimedia.org/wikipedia/commons/3/33/Wednesday_Addams.png", keys:"wandinha wednesday addams" },
  { nome:"Eleven", serie:"Stranger Things", img:"https://upload.wikimedia.org/wikipedia/commons/3/35/Eleven_Stranger_Things.jpg", keys:"eleven stranger things" },
  { nome:"Naruto Uzumaki", serie:"Naruto", img:"https://upload.wikimedia.org/wikipedia/en/9/94/Naruto_Uzumaki.png", keys:"naruto uzumaki" },
  { nome:"Luffy", serie:"One Piece", img:"https://upload.wikimedia.org/wikipedia/en/2/24/Luffy_D._Monkey.png", keys:"luffy one piece" },
  { nome:"Goku", serie:"Dragon Ball", img:"https://upload.wikimedia.org/wikipedia/en/5/5a/Son_Goku_Dragon_Ball.png", keys:"goku dragon ball" },
  { nome:"Harry Potter", serie:"Harry Potter", img:"https://upload.wikimedia.org/wikipedia/en/d/d7/Harry_Potter_character_poster.jpg", keys:"harry potter" },
  { nome:"Stitch", serie:"Lilo & Stitch", img:"https://upload.wikimedia.org/wikipedia/commons/9/92/Stitch_%28Lilo_%26_Stitch%29.png", keys:"stitch lilo" },
  { nome:"Homem-Aranha", serie:"Marvel", img:"https://upload.wikimedia.org/wikipedia/en/0/0c/Spiderman50.jpg", keys:"homem aranha spider man peter parker" },
  { nome:"Batman", serie:"DC", img:"https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg", keys:"batman bruce wayne" },
  { nome:"Barbie", serie:"Barbie", img:"https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_%282023_film%29_poster.jpg", keys:"barbie" },
  { nome:"Grogu", serie:"Mandalorian", img:"https://upload.wikimedia.org/wikipedia/en/5/5a/Grogu.jpg", keys:"grogu baby yoda mandalorian" },
  { nome:"Deadpool", serie:"Marvel", img:"https://upload.wikimedia.org/wikipedia/en/2/23/Deadpool_%28Kieron_Gillen%29.png", keys:"deadpool wade" },
  { nome:"Pikachu", serie:"Pokémon", img:"https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png", keys:"pikachu pokemon" },
  { nome:"Homem de Ferro", serie:"Marvel", img:"https://upload.wikimedia.org/wikipedia/en/4/47/Iron_Man_%28circa_2018%29.png", keys:"homem de ferro iron man tony stark" },
  { nome:"Superman", serie:"DC", img:"https://upload.wikimedia.org/wikipedia/en/3/35/Supermanflying.png", keys:"superman clark kent" },
  { nome:"Mulher-Maravilha", serie:"DC", img:"https://upload.wikimedia.org/wikipedia/en/9/93/Wonder_Woman.jpg", keys:"mulher maravilha wonder woman diana" },
  { nome:"Wolverine", serie:"Marvel", img:"https://upload.wikimedia.org/wikipedia/en/c/c8/Marvelwolverine.jpg", keys:"wolverine logan x-men" },
  { nome:"Homer Simpson", serie:"Simpsons", img:"https://upload.wikimedia.org/wikipedia/en/0/02/Homer_Simpson_2006.png", keys:"homer simpson" },
]

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

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [fotoOriginal,setFotoOriginal]=useState("")
  const [cks,setCks]=useState([])
  const [streak,setStreak]=useState(0)
  const [streakQuebrado,setStreakQuebrado]=useState(false)
  const [showFoto,setShowFoto]=useState(false)
  const [showPuzzle,setShowPuzzle]=useState(false)
  const [buscaFoto,setBuscaFoto]=useState("")
  const [posterLanterna,setPosterLanterna]=useState("")
  const [stats,setStats]=useState({t:0,n:1,xp:0, seriesTotal:0, filmesTotal:0, seriesMaratonadas:0, filmesVistos:0, horasSeries:0, horasFilmes:0})
  const [loading,setLoading]=useState(true)

  const personagensFiltrados = useMemo(()=>{
    if(!buscaFoto.trim()) return PERSONAGENS_REAIS
    const q=buscaFoto.toLowerCase()
    return PERSONAGENS_REAIS.filter(p=> p.nome.toLowerCase().includes(q) || p.keys.includes(q) || p.serie.toLowerCase().includes(q))
  },[buscaFoto])

  useEffect(()=>{
    async function loadPoster(){
      try{
        const r = await fetch(`https://api.themoviedb.org/3/tv/95350?api_key=${TMDB_KEY}&language=pt-BR`).then(x=>x.json())
        if(r?.poster_path) setPosterLanterna(`${TMDB_IMG_BIG}${r.poster_path}`)
      }catch{}
    }
    loadPoster()
  },[])

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
      if(perfil){ if(perfil.nome) setNome(perfil.nome); if(perfil.avatar_url) setFoto(perfil.avatar_url) }
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
    })()
  },[])

  const doCheck = async()=>{
    const h=hojeISO(); if(cks.includes(h)) return
    const { data:{session} } = await supabase.auth.getSession()
    const { error } = await supabase.from("checkins").insert({ user_id: session.user.id, data: h })
    if(!error){ const novo=[...cks,h].sort(); setCks(novo); const { atual } = calcularStreak(novo); setStreak(atual); setStreakQuebrado(false); setStats(s=>{ const xp=s.xp+20; return {...s, n:Math.floor(xp/250)+1, xp} }) }
  }

  const escolherFoto = async(item)=>{
    setFoto(item.img)
    setShowFoto(false)
    localStorage.setItem(user.id+":avatar_personagem_real", JSON.stringify(item))
    const { data:{session} } = await supabase.auth.getSession()
    await supabase.from("perfis").upsert({ user_id: session.user.id, avatar_url: item.img, nome }, { onConflict:"user_id" })
  }

  const progresso = (stats.xp%250)/2.5
  const fezHoje = cks.includes(hojeISO())
  const iconesDesbloqueados = streakQuebrado? 0 : CONQUISTAS.filter(c=> streak>=c.min).length
  const pecasDesbloqueadas = Math.min(20, iconesDesbloqueados * 2 + Math.floor((streak%7)/3))
  const conquistaAtual = streakQuebrado? null : CONQUISTAS.find(c=> streak>=c.min && streak<=c.max)
  const proximo = CONQUISTAS.find(c=> streak < c.min)

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
          <button onClick={()=>setShowPuzzle(true)} style={{background:"#FFD400", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:900, fontSize:12}}>🧩 Desafio Agosto</button>
        </div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <div onClick={()=>setShowFoto(true)} style={{width:68, height:68, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", background:"#1a1a1a", border:`2px solid #FFD400`, cursor:"pointer"}}>
              {foto? <img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : nome[0]}
            </div>
            <div onClick={()=>setShowFoto(true)} style={{position:"absolute", bottom:-2, right:-2, width:22, height:22, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", fontSize:10, border:"2px solid #12182F", cursor:"pointer", color:"#000"}}>✎</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome} <span style={{fontSize:9, background:streak>1?"#FFD40022":"#38bdf822", color:streak>1?"#FFD400":"#38bdf8", border:"1px solid #ffffff15", padding:"2px 6px", borderRadius:99}}>{streak>0? "🍿" : "🧊"} {streak} dias</span></div>
            <div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {conquistaAtual? conquistaAtual.emoji+" "+conquistaAtual.nome : "Sem conquista"} • {pecasDesbloqueadas}/20 peças</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div>
          </div>
          <button onClick={doCheck} disabled={fezHoje} style={{minWidth:96, height:44, borderRadius:999, border:0, background:fezHoje?"#22c55e":"#FFD400", color:fezHoje?"#fff":"#000", fontWeight:900, cursor:fezHoje?"default":"pointer", fontSize:12}}>{fezHoje? "✓ Hoje" : "☑️ Check-in"}</button>
        </div>

        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border: streakQuebrado? "1px solid #38bdf833" : "1px solid #FFD40033", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:14}}>🍿 Minha Maratona</b><span style={{fontSize:11, background:streakQuebrado?"#38bdf822":"#FFD40022", color:streakQuebrado?"#38bdf8":"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #ffffff15"}}>{streakQuebrado? "Zerado" : `${iconesDesbloqueados}/${CONQUISTAS.length} ícones`}</span></div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:12}}>
            {CONQUISTAS.map(c=>{ const desbloq = streak>=c.min; return (
              <div key={c.id} style={{background: desbloq &&!streakQuebrado? "#FFD40014" : "#ffffff06", border: desbloq &&!streakQuebrado? "1px solid #FFD40044" : "1px solid #ffffff10", borderRadius:12, padding:10, textAlign:"center", opacity: desbloq &&!streakQuebrado? 1 : 0.35}}>
                <div style={{fontSize:22}}>{c.emoji}</div>
                <div style={{fontSize:10, fontWeight:800, marginTop:4}}>{c.nome}</div>
              </div>
            )})}
          </div>
          <div onClick={()=>setShowPuzzle(true)} style={{marginTop:12, background:"#FFD400", color:"#000", borderRadius:10, padding:"8px 10px", fontSize:11, textAlign:"center", fontWeight:900, cursor:"pointer"}}>🧩 Ver quebra-cabeça • {pecasDesbloqueadas}/20 peças</div>
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
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}><b>Escolha seu personagem</b><button onClick={()=>setShowFoto(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button></div>
            <div style={{display:"flex", alignItems:"center", gap:8, background:"#0E1430", border:"1px solid #ffffff12", height:42, borderRadius:999, padding:"0 14px", marginBottom:12}}><span style={{opacity:0.5}}>🔍</span><input value={buscaFoto} onChange={e=>setBuscaFoto(e.target.value)} placeholder="Buscar: Harry Potter, Stitch, Wandinha..." style={{flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13}} /></div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {personagensFiltrados.map(p=>(
                <div key={p.nome} onClick={()=>escolherFoto(p)} style={{cursor:"pointer", textAlign:"center", background:"#ffffff06", border:"1px solid #ffffff0f", borderRadius:14, padding:8}}>
                  <div style={{width:"100%", aspectRatio:"1", borderRadius:12, overflow:"hidden", background:"#fff", border:"1px solid #ffffff15"}}>
                    <img src={p.img} alt={p.nome} style={{width:"100%",height:"100%",objectFit:"contain"}} />
                  </div>
                  <div style={{fontSize:11, marginTop:6, fontWeight:800}}>{p.nome}</div>
                  <div style={{fontSize:9, opacity:0.5}}>{p.serie}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPuzzle && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)", zIndex:10001, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b style={{fontSize:16}}>Desafio de agosto</b>
              <button onClick={()=>setShowPuzzle(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12, marginBottom:12}}>
              <div style={{fontSize:12, lineHeight:1.5}}>Série do mês. Complete os check-ins diários para liberar as peças e descobrir qual é a série do mês. Cada conquista = 2 peças do quebra-cabeça.</div>
              <div style={{marginTop:10, display:"flex", gap:8, alignItems:"center"}}>
                {posterLanterna && <img src={posterLanterna} alt="Lanterns" style={{width:56, height:84, borderRadius:8, objectFit:"cover", border:"1px solid #ffffff15"}} />}
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:900}}>Lanterns • Cartaz oficial HBO</div>
                  <div style={{fontSize:11, opacity:0.6, marginTop:2}}>Estreou 16/08 • Hal Jordan e John Stewart • Anel com silhuetas</div>
                  <div style={{marginTop:8, height:6, background:"#ffffff14", borderRadius:99, overflow:"hidden"}}><div style={{width:`${(pecasDesbloqueadas/20)*100}%`, height:"100%", background:"#FFD400"}}/></div>
                  <div style={{fontSize:10, opacity:0.5, marginTop:4}}>{pecasDesbloqueadas}/20 peças • {iconesDesbloqueados}/9 conquistas</div>
                </div>
              </div>
            </div>
            <div style={{background:"#000", borderRadius:16, overflow:"hidden", border:"1px solid #ffffff15"}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, background:"#000", padding:2}}>
                {Array.from({length:20}).map((_,i)=>{
                  const liberada = i < pecasDesbloqueadas
                  return (
                    <div key={i} style={{aspectRatio:"3/4", position:"relative", overflow:"hidden", background:"#111", borderRadius:4}}>
                      {posterLanterna && <img src={posterLanterna} alt="" style={{width:"400%", height:"500%", objectFit:"cover", position:"absolute", left:`-${(i%4)*100}%`, top:`-${Math.floor(i/4)*100}%`, filter: liberada? "none" : "blur(14px) brightness(0.25)"}} />}
                      {!liberada && <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center", fontSize:18, background:"rgba(0,0,0,0.5)"}}>🔒</div>}
                    </div>
                  )
                })}
              </div>
            </div>
            {pecasDesbloqueadas===20 && <div style={{marginTop:12, background:"#22c55e", color:"#fff", borderRadius:12, padding:"12px", textAlign:"center", fontWeight:900}}>🎉 Você liberou o cartaz completo de Lanterns!</div>}
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
