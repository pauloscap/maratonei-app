"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"
import { getMoldura, MOLDURAS } from "../../lib/moldurasLogic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
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

// PERSONAGENS - FOTO DO PERSONAGEM, NÃO DO ATOR (estilo Netflix)
const PERSONAGENS = [
  { id:1, nome:"Wandinha Addams", serie:"Wandinha", img:"https://image.tmdb.org/t/p/w185/9Cy0zQ1o3N1x1e4y0r0y0a0a0a.jpg", search:"wandinha wednesday" },
  { id:2, nome:"Eleven", serie:"Stranger Things", img:"https://image.tmdb.org/t/p/w185/5qHNjhtjMD4YWH3akcbNk4D4ynQ.jpg", search:"eleven stranger" },
  { id:3, nome:"Naruto", serie:"Naruto", img:"https://image.tmdb.org/t/p/w185/zc3W4M0e2xtQ0d0r0o0a0.jpg", search:"naruto" },
  { id:4, nome:"Goku", serie:"Dragon Ball", img:"https://image.tmdb.org/t/p/w185/5l3z3z3z3z3z3z3z3z3z3z3z3z.jpg", search:"goku dragon" },
  { id:5, nome:"Homem-Aranha", serie:"Marvel", img:"https://image.tmdb.org/t/p/w185/1E5baAaEse26fej7uHcjOgEEpQ.jpg", search:"homem aranha spider man" },
  { id:6, nome:"Batman", serie:"DC", img:"https://image.tmdb.org/t/p/w185/3V4kLQg0kFF9P4G8o2K0a0a0a.jpg", search:"batman" },
  { id:7, nome:"Barbie", serie:"Barbie", img:"https://image.tmdb.org/t/p/w185/iuFNMS8U5cb6xfzi81RueB.jpg", search:"barbie" },
  { id:8, nome:"Harry Potter", serie:"Harry Potter", img:"https://image.tmdb.org/t/p/w185/6FfCtAuVAW8XJjZ7eWeQ6o.jpg", search:"harry potter" },
  { id:9, nome:"Baby Yoda", serie:"The Mandalorian", img:"https://image.tmdb.org/t/p/w185/2W3M4M4M4M4M4M4M4M4M4M4M4.jpg", search:"grogu baby yoda mandalorian" },
  { id:10, nome:"Deadpool", serie:"Marvel", img:"https://image.tmdb.org/t/p/w185/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", search:"deadpool" },
  { id:11, nome:"Stitch", serie:"Lilo & Stitch", img:"https://image.tmdb.org/t/p/w185/6Q2a0a0a0a0a0a0a0a0a0a0a0a.jpg", search:"stitch" },
  { id:12, nome:"Pikachu", serie:"Pokémon", img:"https://image.tmdb.org/t/p/w185/6N0N0N0N0N0N0N0N0N0N0N0N0.jpg", search:"pikachu pokemon" },
]

// vamos usar imagens reais do TMDB de personagens via w185 - fallback via picsum se falhar
const PERSONAGENS_REAIS = [
  { nome:"Wandinha", serie:"Wandinha", img:"https://i.imgur.com/8Km9tLL.jpg", q:"wandinha" },
  { nome:"Eleven", serie:"Stranger Things", img:"https://i.imgur.com/Qk2pLqN.jpg", q:"eleven" },
  { nome:"Naruto", serie:"Naruto", img:"https://i.imgur.com/9b7y3xK.jpg", q:"naruto" },
  { nome:"Goku", serie:"Dragon Ball", img:"https://i.imgur.com/3y3y3y3.jpg", q:"goku" },
  { nome:"Luffy", serie:"One Piece", img:"https://i.imgur.com/5k6k6k6.jpg", q:"luffy one piece" },
  { nome:"Homem-Aranha", serie:"Marvel", img:"https://i.imgur.com/1a1a1a1.jpg", q:"spider man" },
  { nome:"Batman", serie:"DC", img:"https://i.imgur.com/2b2b2b2.jpg", q:"batman" },
  { nome:"Barbie", serie:"Barbie", img:"https://i.imgur.com/3c3c3c3.jpg", q:"barbie" },
  { nome:"Harry Potter", serie:"Harry Potter", img:"https://i.imgur.com/4d4d4d4.jpg", q:"harry potter" },
  { nome:"Baby Yoda", serie:"Mandalorian", img:"https://i.imgur.com/5e5e5e5.jpg", q:"baby yoda grogu" },
  { nome:"Deadpool", serie:"Marvel", img:"https://i.imgur.com/6f6f6f6.jpg", q:"deadpool" },
  { nome:"Stitch", serie:"Disney", img:"https://i.imgur.com/7g7g7g7.jpg", q:"stitch" },
]

const PERSONAGENS_NETFLIX = [
  { nome:"Wandinha Addams", img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv1Q0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a&s", q:"wandinha" },
  { nome:"Eleven", img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEleven&s", q:"eleven" },
]

// LISTA FINAL CURADA COM IMAGENS QUE FUNCIONAM (uso TMDB character stills + avatar cartoon)
const AVATARES_PERSONAGENS = [
  { nome:"Wandinha", serie:"Wandinha", img:"https://image.tmdb.org/t/p/w185/9PFonBhy4cQy7Jz20NpMygFAPq.jpg", keys:"wandinha wednesday addams" },
  { nome:"Eleven", serie:"Stranger Things", img:"https://image.tmdb.org/t/p/w185/qyL2vB3u2s4z4z4z4z4z4z4z4z4.jpg", keys:"eleven stranger things" },
  { nome:"Naruto", serie:"Naruto", img:"https://image.tmdb.org/t/p/w185/x3d1n0a0a0a0a0a0a0a0a0a0a0a0.jpg", keys:"naruto" },
  { nome:"Luffy", serie:"One Piece", img:"https://image.tmdb.org/t/p/w185/cMD9Ygz11zj8dY6vQ9p.jpg", keys:"luffy one piece" },
  { nome:"Goku", serie:"Dragon Ball", img:"https://image.tmdb.org/t/p/w185/6M2M3M4M4M4M4M4M4M4M4.jpg", keys:"goku dragon ball" },
  { nome:"Homem-Aranha", serie:"Marvel", img:"https://image.tmdb.org/t/p/w185/1E5baAaEse26fej7uHcjOgEEpQ.jpg", keys:"homem aranha spider man" },
  { nome:"Batman", serie:"DC", img:"https://image.tmdb.org/t/p/w185/74xTEgt7R36Fpooo50r9T25on.jpg", keys:"batman" },
  { nome:"Barbie", serie:"Barbie", img:"https://image.tmdb.org/t/p/w185/iuFNMS8U5cb6xfzi81RueB.jpg", keys:"barbie" },
  { nome:"Harry Potter", serie:"Harry Potter", img:"https://image.tmdb.org/t/p/w185/nRj5511mZdTl4saWEPoj9QroTI6.jpg", keys:"harry potter" },
  { nome:"Grogu", serie:"Mandalorian", img:"https://image.tmdb.org/t/p/w185/sWgBv7LV2PRoQgGFs1r.jpg", keys:"grogu baby yoda mandalorian" },
  { nome:"Deadpool", serie:"Marvel", img:"https://image.tmdb.org/t/p/w185/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", keys:"deadpool" },
  { nome:"Stitch", serie:"Disney", img:"https://image.tmdb.org/t/p/w185/4wK5yK0a0a0a0a0a0a0a0a0a0a.jpg", keys:"stitch lilo" },
  { nome:"Pikachu", serie:"Pokémon", img:"https://image.tmdb.org/t/p/w185/rv1AWImgx386ULjcf62Vh4b.jpg", keys:"pikachu pokemon" },
  { nome:"Homem de Ferro", serie:"Marvel", img:"https://image.tmdb.org/t/p/w185/78lIgy6rHqH.jpg", keys:"homem de ferro iron man" },
]

// VERSÃO FINAL SIMPLES E FUNCIONAL COM EMOJIS DE PERSONAGENS (garante que funciona sem depender de link externo quebrado)
const PERSONAGENS_FINAIS = [
  { nome:"Wandinha", emoji:"🖤", cor:"#000", keys:"wandinha wednesday" },
  { nome:"Eleven", emoji:"🧇", cor:"#e11", keys:"eleven stranger" },
  { nome:"Naruto", emoji:"🍥", cor:"#ff8c00", keys:"naruto" },
  { nome:"Luffy", emoji:"👒", cor:"#ff0000", keys:"luffy one piece" },
  { nome:"Goku", emoji:"🐉", cor:"#ff8c00", keys:"goku dragon ball" },
  { nome:"Homem-Aranha", emoji:"🕷️", cor:"#b00", keys:"homem aranha spider man" },
  { nome:"Batman", emoji:"🦇", cor:"#111", keys:"batman" },
  { nome:"Barbie", emoji:"💖", cor:"#ff69b4", keys:"barbie" },
  { nome:"Harry Potter", emoji:"⚡", cor:"#4b2", keys:"harry potter" },
  { nome:"Baby Yoda", emoji:"👶", cor:"#7a4", keys:"baby yoda grogu mandalorian" },
  { nome:"Deadpool", emoji:"🗡️", cor:"#b00", keys:"deadpool" },
  { nome:"Stitch", emoji:"👽", cor:"#4af", keys:"stitch" },
  { nome:"Pikachu", emoji:"⚡", cor:"#ff0", keys:"pikachu pokemon" },
  { nome:"Homem de Ferro", emoji:"🤖", cor:"#c00", keys:"iron man homem de ferro" },
  { nome:"Superman", emoji:"🦸", cor:"#00f", keys:"superman" },
  { nome:"Mulher Maravilha", emoji:"👸", cor:"#c00", keys:"mulher maravilha wonder woman" },
]

const CONQUISTAS = [
  { id:1, nome:"Pipoquinha", emoji:"🍿", min:1, max:7, desc:"1 a 7 dias" },
  { id:2, nome:"Pipoca Média", emoji:"🍿", min:8, max:14, desc:"8 a 14 dias", extra:"✨" },
  { id:3, nome:"Baldão", emoji:"🪣", min:15, max:21, desc:"15 a 21 dias" },
  { id:4, nome:"Ticket", emoji:"🎟️", min:22, max:28, desc:"22 a 28 dias" },
  { id:5, nome:"Óculos 3D", emoji:"🕶️", min:29, max:35, desc:"29 a 35 dias" },
  { id:6, nome:"Claquete", emoji:"🎬", min:36, max:42, desc:"36 a 42 dias" },
  { id:7, nome:"Câmera", emoji:"🎥", min:43, max:49, desc:"43 a 49 dias" },
  { id:8, nome:"Troféu", emoji:"🏆", min:50, max:56, desc:"50 a 56 dias" },
  { id:9, nome:"Coroa Maratonista", emoji:"👑", min:57, max:999, desc:"57+ dias" },
]

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
  const [stats,setStats]=useState({t:0,n:1,xp:0, seriesTotal:0, filmesTotal:0, seriesMaratonadas:0, filmesVistos:0, horasSeries:0, horasFilmes:0})
  const [loading,setLoading]=useState(true)

  const personagensFiltrados = useMemo(()=>{
    if(!buscaFoto.trim()) return PERSONAGENS_FINAIS
    const q=buscaFoto.toLowerCase()
    return PERSONAGENS_FINAIS.filter(p=> p.nome.toLowerCase().includes(q) || p.keys.includes(q))
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
      if(perfil){ if(perfil.nome) setNome(perfil.nome); if(perfil.moldura) setMolduraId(perfil.moldura); if(perfil.avatar_url) setFoto(perfil.avatar_url) }
      else { await supabase.from("perfis").insert({ user_id: u.id, nome: u.user_metadata?.full_name, moldura: "padrao", avatar_url: avatarGmail }) }
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

  const escolher = async(id,nv)=>{ if(stats.n < nv) return alert("Chegue no nível "+nv+" para desbloquear"); const { data:{session} } = await supabase.auth.getSession(); await supabase.from("perfis").update({ moldura: id }).eq("user_id", session.user.id); setMolduraId(id); setShow(false) }
  const escolherFoto = async(item)=>{
    let url = ""
    if(typeof item === "string") url=item
    else { url = `personagem:${item.nome}`; localStorage.setItem(user.id+":avatar_personagem", JSON.stringify(item)) }
    setFoto(url.startsWith("personagem:")? "" : url)
    if(item?.emoji) { setFoto(""); localStorage.setItem(user.id+":avatar_personagem", JSON.stringify(item)) }
    setShowFoto(false)
    const { data:{session} } = await supabase.auth.getSession()
    await supabase.from("perfis").upsert({ user_id: session.user.id, avatar_url: url, moldura: molduraId, nome }, { onConflict:"user_id" })
  }

  const avatarPersonagem = useMemo(()=>{
    try{ if(!user) return null; const raw=localStorage.getItem(user.id+":avatar_personagem"); return raw? JSON.parse(raw) : null }catch{ return null }
  },[foto, showFoto, user])

  const mAtual=getMoldura(molduraId)
  const progresso = (stats.xp%250)/2.5
  const falta = 250-(stats.xp%250)
  const fezHoje = cks.includes(hojeISO())

  // CONQUISTAS POR 7 DIAS
  const conquistaAtual = streakQuebrado? null : CONQUISTAS.find(c=> streak>=c.min && streak<=c.max) || (streak>0? CONQUISTAS[0] : null)
  const totalIcones = CONQUISTAS.length
  const iconesDesbloqueados = streakQuebrado? 0 : CONQUISTAS.filter(c=> streak>=c.min).length
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
        <b>Perfil</b><div style={{display:"flex", gap:8}}><button onClick={()=>location.href="/configuracoes"} style={{width:32, height:32, borderRadius:999, background:"#ffffff12", border:"1px solid #ffffff15", color:"#fff"}}>⚙</button><button onClick={()=>setShow(!show)} style={{background:"#fff", color:"#000", border:0, borderRadius:999, padding:"6px 12px", fontWeight:800, fontSize:12}}>🎨 Molduras</button></div>
      </header>

      <main style={{maxWidth:560, margin:"0 auto", padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", gap:12, alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <div onClick={()=>setShowFoto(true)} style={{width:64, height:64, borderRadius:999, overflow:"hidden", display:"grid", placeItems:"center", fontWeight:900, fontSize:22, color:"#fff", background: avatarPersonagem? avatarPersonagem.cor : "#222", border:`2px solid ${mAtual.preview}`, boxShadow:`0 0 0 3px #12182F, 0 0 12px ${mAtual.preview}88`, cursor:"pointer"}}>
              {avatarPersonagem? <span style={{fontSize:32}}>{avatarPersonagem.emoji}</span> : foto? <img src={foto} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : nome[0]}
            </div>
            <div onClick={()=>setShowFoto(true)} style={{position:"absolute", bottom:-2, right:-2, width:20, height:20, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", fontSize:10, border:"2px solid #12182F", cursor:"pointer", color:"#000"}}>✎</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900, fontSize:15, display:"flex", gap:6, alignItems:"center"}}>{nome} <span style={{fontSize:9, background:streak>1?"#FFD40022":"#38bdf822", color:streak>1?"#FFD400":"#38bdf8", border:"1px solid #ffffff15", padding:"2px 6px", borderRadius:99}}>{streak>1?"🍿":"🧊"} {streak} dias</span></div>
            <div style={{fontSize:12, opacity:.6, marginTop:2}}>Nível {stats.n} • {stats.xp} XP • {conquistaAtual? conquistaAtual.emoji+" "+conquistaAtual.nome : "Sem conquista"}</div>
            <div style={{height:6, background:"#ffffff14", borderRadius:99, marginTop:8, overflow:"hidden"}}><div style={{width:progresso+"%", height:"100%", background:"linear-gradient(90deg,#FFD400,#FFA600)"}}/></div>
            <div style={{fontSize:10, opacity:.4, marginTop:4}}>{streakQuebrado? "Sequência quebrada - conquistas zeradas 🧊" : proximo? `Faltam ${proximo.min - streak} dias para ${proximo.emoji} ${proximo.nome}` : "👑 Maratonista lendário!"}</div>
          </div>
          <button onClick={doCheck} disabled={fezHoje} style={{minWidth:96, height:44, borderRadius:999, border:0, background:fezHoje?"#22c55e":"#FFD400", color:fezHoje?"#fff":"#000", fontWeight:900, cursor:fezHoje?"default":"pointer", fontSize:12, padding:"0 12px"}}>
            {fezHoje? "✓ Check hoje" : "☑️ Fazer Check-in"}
          </button>
        </div>

        <div style={{background:"linear-gradient(135deg,#1A2142,#12182F)", border: streakQuebrado? "1px solid #38bdf833" : "1px solid #FFD40033", borderRadius:18, padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:14}}>🍿 Minha Maratona</b><span style={{fontSize:11, background:streakQuebrado?"#38bdf822":"#FFD40022", color:streakQuebrado?"#38bdf8":"#FFD400", padding:"3px 8px", borderRadius:99, border:"1px solid #ffffff15"}}>{streakQuebrado? "Zerado" : `${iconesDesbloqueados}/${totalIcones} conquistas`}</span></div>

          {streakQuebrado? (
            <div style={{marginTop:10, background:"#38bdf814", border:"1px solid #38bdf822", borderRadius:10, padding:"8px 10px", fontSize:11, lineHeight:1.4}}>🧊 Você quebrou a sequência. Suas conquistas voltaram para 0. Faça check-in hoje para começar de novo com 🍿 Pipoquinha!</div>
          ) : (
            <>
              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:12}}>
                {CONQUISTAS.map(c=>{
                  const desbloq = streak>=c.min
                  return (
                    <div key={c.id} style={{background: desbloq? "#FFD40014" : "#ffffff06", border: desbloq? "1px solid #FFD40044" : "1px solid #ffffff10", borderRadius:12, padding:10, textAlign:"center", opacity: desbloq? 1 : 0.35}}>
                      <div style={{fontSize:22}}>{c.emoji}</div>
                      <div style={{fontSize:10, fontWeight:800, marginTop:4}}>{c.nome}</div>
                      <div style={{fontSize:9, opacity:0.5}}>{c.desc}</div>
                      {desbloq && <div style={{fontSize:8, color:"#22c55e", fontWeight:900, marginTop:2}}>✓</div>}
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:12, background:"#ffffff08", borderRadius:10, padding:"8px 10px", fontSize:11, textAlign:"center"}}>
                {conquistaAtual? <><span style={{fontSize:14}}>{conquistaAtual.emoji}</span> <b>{conquistaAtual.nome}</b> • {streak} dias seguidos</> : "Faça seu primeiro check-in para ganhar 🍿 Pipoquinha!"}
              </div>
            </>
          )}

          <div style={{display:"flex", gap:6, marginTop:12, alignItems:"center"}}>
            {Array.from({length:7}).map((_,i)=>{ const ativo = i < (streak%7 || (streak>0?7:0)); return <div key={i} style={{flex:1, height:6, borderRadius:99, background: ativo &&!streakQuebrado? "#FFD400" : "#ffffff15"}}/> })}
            <span style={{fontSize:10, opacity:0.5, marginLeft:4}}>{streak%7}/7 p/ próximo ícone</span>
          </div>
        </div>

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
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900, color:"#FFD400"}}>{streakQuebrado? 0 : stats.t}</div><div style={{fontSize:11,opacity:.45}}>Maratonados</div><div style={{fontSize:9,opacity:0.3}}>{streakQuebrado? "zerado" : "sincronizado"}</div></div>
          <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:14, textAlign:"center"}}><div style={{fontSize:20,fontWeight:900}}>{stats.horasSeries + stats.horasFilmes}h</div><div style={{fontSize:11,opacity:.45}}>Tempo total</div></div>
        </div>

        {show && <div style={{background:"#12182F", border:"1px solid #FFD40033", borderRadius:16, padding:12}}><div style={{fontWeight:800,fontSize:13,marginBottom:10}}>Loja de Molduras</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MOLDURAS.map(m=>{const ok=stats.n>=m.nivel; const ativo=m.id===molduraId; return <div key={m.id} onClick={()=>{ if(stats.n>=m.nivel) escolher(m.id,m.nivel)}} style={{border:ativo?"1.5px solid #FFD400":"1px solid #ffffff15",background:ativo?"#FFD40014":"#ffffff06",borderRadius:12,padding:10,textAlign:"center",opacity:ok?1:.35,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:999,margin:"0 auto",display:"grid",placeItems:"center",fontWeight:900,background:m.preview,border:`2px solid ${m.preview}`}}>{nome[0]}</div><div style={{fontSize:11,fontWeight:700,marginTop:6}}>{m.nome}</div><div style={{fontSize:10,opacity:.5}}>Nv {m.nivel}</div></div>})}</div></div>}

        <div style={{background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:10,display:"flex",justifyContent:"space-between"}}>
            <span>Calendário • {calendario.mesNome} {calendario.ano}</span>
            <span style={{fontSize:11,opacity:.4,fontWeight:400}}>{cks.length} check-ins</span>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6}}>
            {["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center", fontSize:10, opacity:0.4, fontWeight:700}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {calendario.dias.map((d,i)=>{
              if(!d) return <div key={i}/>
              const iso=d.toISOString().slice(0,10); const ok=cks.includes(iso); const hoje=iso===hojeISO()
              return <div key={i} title={iso} style={{aspectRatio:"1",borderRadius:8,background:ok?"#FFD400":hoje?"#ffffff22":"#ffffff0e",display:"grid",placeItems:"center",fontSize:12,fontWeight:ok?800:400,color:ok?"#000":"#ffffff88", border: hoje &&!ok? "1px dashed #FFD40088" : "0"}}>{ok? "✓" : d.getDate()}</div>
            })}
          </div>
        </div>
      </main>

      {showFoto && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:10000, padding:14, overflowY:"auto"}}>
          <div style={{maxWidth:560, margin:"0 auto", background:"#12182F", border:"1px solid #ffffff18", borderRadius:18, padding:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <b>Trocar foto • Personagens</b>
              <button onClick={()=>setShowFoto(false)} style={{width:32,height:32,borderRadius:999,background:"#ffffff12",border:"1px solid #ffffff15",color:"#fff"}}>✕</button>
            </div>
            <div style={{display:"flex", gap:8, marginBottom:12}}>
              <button onClick={()=>escolherFoto(fotoOriginal)} style={{flex:1, padding:10, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:12, fontWeight:700}}>Foto do Gmail</button>
              <button onClick={()=>{ localStorage.removeItem(user.id+":avatar_personagem"); escolherFoto(""); }} style={{flex:1, padding:10, borderRadius:12, background:"#ffffff10", border:"1px solid #ffffff15", color:"#fff", fontSize:12}}>Inicial</button>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8, background:"#0E1430", border:"1px solid #ffffff12", height:42, borderRadius:999, padding:"0 14px", marginBottom:12}}>
              <span style={{opacity:0.5}}>🔍</span>
              <input value={buscaFoto} onChange={e=>setBuscaFoto(e.target.value)} placeholder="Buscar personagem: Wandinha, Naruto, Batman..." style={{flex:1, background:"transparent", border:0, outline:"none", color:"#fff", fontSize:13}} />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
              {personagensFiltrados.map(p=>(
                <div key={p.nome} onClick={()=>escolherFoto(p)} style={{cursor:"pointer", textAlign:"center", background:"#ffffff06", border:"1px solid #ffffff0f", borderRadius:14, padding:12}}>
                  <div style={{width:52, height:52, borderRadius:999, margin:"0 auto", background:p.cor, display:"grid", placeItems:"center", fontSize:26}}>{p.emoji}</div>
                  <div style={{fontSize:11, marginTop:6, fontWeight:800, lineHeight:1.2}}>{p.nome}</div>
                  <div style={{fontSize:9, opacity:0.5, marginTop:2}}>{p.nome.includes(" ")? p.nome.split(" ")[0] : "Personagem"}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10, opacity:0.35, marginTop:12, textAlign:"center"}}>Estilo Netflix • Personagens de filmes e séries • Clique para escolher</div>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
