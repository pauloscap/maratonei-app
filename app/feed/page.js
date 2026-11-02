"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function FeedPage() {
  const [tab,setTab] = useState("seguindo")
  const [userId,setUserId] = useState(null)
  const [following,setFollowing] = useState([])
  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError("")
      const { data: auth } = await supabase.auth.getSession()
      const viewer = auth?.session?.user?.id || null
      if (!active) return
      setUserId(viewer)
      if (!viewer) { setLoading(false); return }

      const { data: relations, error: relationError } = await supabase
        .from("seguidores").select("seguindo_id").eq("seguidor_id",viewer)
      if (!active) return
      if (relationError) {
        setError("Não foi possível carregar quem você segue.")
        setLoading(false)
        return
      }
      setFollowing((relations || []).map(row => row.seguindo_id))

      const [filmes, series, episodios, comentarios, avaliacoes] = await Promise.all([
        supabase.from("feed_filmes").select("id,user_id,filme_id,titulo,img,updated_at").order("updated_at",{ascending:false}).limit(60),
        supabase.from("feed_series").select("id,user_id,serie_id,titulo,img,status,episodios_vistos,updated_at").order("updated_at",{ascending:false}).limit(60),
        supabase.from("feed_episode_progress").select("user_id,serie_id,episode_id,season_number,episode_number,episode_title,source,watched_at,series_title,series_img").order("watched_at",{ascending:false}).limit(100),
        supabase.from("feed_episode_comments").select("id,user_id,serie_id,temporada_numero,episodio_numero,comentario,created_at,series_title").order("created_at",{ascending:false}).limit(60),
        supabase.from("feed_episode_ratings").select("id,user_id,serie_id,temporada_numero,episodio_numero,nota,comentario,created_at,series_title").order("created_at",{ascending:false}).limit(60)
      ])
      if (!active) return
      const failed = [filmes,series,episodios,comentarios,avaliacoes].find(result => result.error)
      if (failed) {
        console.error("[feed] Falha ao carregar projeções públicas:", failed.error)
        setError("Não foi possível carregar as atividades. Tente novamente em instantes.")
        setLoading(false)
        return
      }

      const timeline = [
        ...(filmes.data || []).map(row => ({...row,type:"film",date:row.updated_at})),
        ...(series.data || []).map(row => ({...row,type:"series",date:row.updated_at})),
        ...(episodios.data || []).map(row => ({...row,type:"episode",date:row.watched_at})),
        ...(comentarios.data || []).map(row => ({...row,type:"comment",date:row.created_at})),
        ...(avaliacoes.data || []).map(row => ({...row,type:"rating",date:row.created_at}))
      ].sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

      const profileIds = [...new Set(timeline.map(row => row.user_id).filter(Boolean))]
      let profiles = []
      if (profileIds.length) {
        const { data, error: profileError } = await supabase.from("profiles")
          .select("id,username,nome,avatar_url").in("id",profileIds)
        if (profileError) console.warn("[feed] Perfis indisponíveis:", profileError.message)
        profiles = data || []
      }
      if (!active) return
      const profileMap = Object.fromEntries(profiles.map(profile => [profile.id,profile]))
      setItems(timeline.map(row => ({...row,profile:profileMap[row.user_id] || null})))
      setLoading(false)
    }
    load()
    return () => { active = false }
  },[])

  const visible = useMemo(() => tab === "seguindo"
    ? items.filter(item => following.includes(item.user_id))
    : items, [items,following,tab])

  const dateLabel = value => {
    if (!value) return "Data não informada"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? "Data não informada" :
      date.toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})
  }

  function activityText(item) {
    if (item.type === "film") return "marcou como assistido o filme"
    if (item.type === "episode") return "assistiu a um episódio de"
    if (item.type === "comment") return "comentou um episódio de"
    if (item.type === "rating") return "avaliou um episódio de"
    if (item.status === "maratonei") return "concluiu a série"
    if (item.status === "ja_assisti") return "marcou como assistida a série"
    return "está assistindo à série"
  }

  function titleFor(item) {
    if (item.type === "film" || item.type === "series") return item.titulo
    if (item.type === "episode" || item.type === "comment" || item.type === "rating") return item.series_title || "uma série"
    return ""
  }

  return <main style={{minHeight:"100vh",background:"#080F25",color:"#fff",paddingBottom:100,fontFamily:"Inter,sans-serif"}}>
    <header style={{padding:"22px 18px 16px",borderBottom:"1px solid #ffffff12",background:"#0b1430"}}>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <p style={{color:"#FFD400",fontSize:10,fontWeight:900,letterSpacing:2,margin:"0 0 6px"}}>MARATONEI SOCIAL</p>
        <h1 style={{fontSize:25,fontWeight:900,margin:0}}>Amigos</h1>
        <p style={{color:"#9CAACB",fontSize:12,margin:"7px 0 0"}}>Acompanhe filmes, séries, episódios assistidos, avaliações e comentários da comunidade.</p>
      </div>
    </header>
    <section style={{maxWidth:760,margin:"0 auto",padding:"16px 14px"}}>
      <div role="tablist" aria-label="Feed" style={{display:"flex",gap:8,padding:4,borderRadius:14,background:"#111b38",marginBottom:16}}>
        <button role="tab" aria-selected={tab==="seguindo"} onClick={()=>setTab("seguindo")} style={{flex:1,border:0,borderRadius:10,padding:12,fontWeight:900,fontSize:12,background:tab==="seguindo"?"#FFD400":"transparent",color:tab==="seguindo"?"#080F25":"#AAB4CE"}}>Seguindo</button>
        <button role="tab" aria-selected={tab==="paraVoce"} onClick={()=>setTab("paraVoce")} style={{flex:1,border:0,borderRadius:10,padding:12,fontWeight:900,fontSize:12,background:tab==="paraVoce"?"#FFD400":"transparent",color:tab==="paraVoce"?"#080F25":"#AAB4CE"}}>Para você</button>
      </div>
      {!userId && !loading && <div style={{padding:22,borderRadius:18,background:"#111b38",textAlign:"center"}}>
        <div style={{fontSize:30}}>🍿</div><h2 style={{fontSize:17,margin:"10px 0 6px"}}>Entre para fazer parte da comunidade</h2>
        <p style={{color:"#AAB4CE",fontSize:12,lineHeight:1.6}}>Faça login para acompanhar pessoas e participar do Maratonei Social.</p>
        <Link href="/login" style={{display:"inline-block",marginTop:8,padding:"11px 20px",borderRadius:999,background:"#FFD400",color:"#080F25",fontWeight:900,textDecoration:"none",fontSize:12}}>Entrar</Link>
      </div>}
      {loading && <p style={{color:"#AAB4CE",textAlign:"center",padding:30}}>Carregando atividades...</p>}
      {error && <p role="alert" style={{color:"#FCA5A5",padding:14,background:"#451a2b",borderRadius:12,fontSize:12}}>{error}</p>}
      {!loading && userId && visible.length===0 && !error && <div style={{padding:24,borderRadius:18,background:"#111b38",border:"1px solid #ffffff12",textAlign:"center"}}>
        <div style={{fontSize:34}}>🎬</div>
        <h2 style={{fontSize:17,margin:"10px 0 6px"}}>{tab==="seguindo"?"Seu feed está começando":"A comunidade está aquecendo"}</h2>
        <p style={{color:"#AAB4CE",fontSize:12,lineHeight:1.6}}>{tab==="seguindo"?"Siga outros maratoneiros para ver as atividades deles por aqui.":"Ainda não há atividades públicas para mostrar. Volte em breve para descobrir as maratonas da comunidade."}</p>
        <Link href="/busca" style={{display:"inline-block",marginTop:8,color:"#FFD400",fontWeight:900,fontSize:12,textDecoration:"none"}}>Descobrir pessoas →</Link>
      </div>}
      {!loading && visible.map((item,index) => <article key={item.type+":"+item.user_id+":"+(item.id || item.episode_id || item.serie_id || index)} style={{display:"flex",gap:12,padding:15,marginBottom:10,borderRadius:16,background:"#111b38",border:"1px solid #ffffff12"}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:"#28365d",display:"grid",placeItems:"center",flexShrink:0,overflow:"hidden"}}>
          {item.profile?.avatar_url?.startsWith("http") ? <img src={item.profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontWeight:900,color:"#FFD400"}}>{(item.profile?.nome||item.profile?.username||"M").slice(0,1).toUpperCase()}</span>}
        </div>
        <div style={{minWidth:0,flex:1}}>
          <p style={{margin:"1px 0 5px",fontSize:12,color:"#E8ECF8",lineHeight:1.5}}>
            <Link href={"/perfil/"+item.user_id} style={{color:"#FFD400",fontWeight:900,textDecoration:"none"}}>{item.profile?.nome||item.profile?.username||"Maratoneiro"}</Link>{" "+activityText(item)}{" "}
            {titleFor(item) && <strong>{titleFor(item)}</strong>}
          </p>
          {item.type==="episode" && <p style={{margin:"0 0 5px",color:"#B7A5FF",fontSize:11}}>T{item.season_number} E{item.episode_number} · {item.episode_title || "Episódio"}{item.source==="legacy" ? " · histórico sem data individual" : ""}</p>}
          {(item.type==="comment" || item.type==="rating") && <p style={{margin:"0 0 5px",color:"#B7A5FF",fontSize:11}}>T{item.temporada_numero} E{item.episodio_numero}{item.type==="rating" && item.nota!=null ? " · Nota "+item.nota : ""}</p>}
          {(item.type==="comment" || item.type==="rating") && item.comentario && <p style={{margin:"0 0 5px",color:"#CBD5E1",fontSize:11,lineHeight:1.45}}>{item.comentario}</p>}
          {item.type==="series" && <p style={{margin:"0 0 5px",color:"#8997B8",fontSize:10}}>{item.episodios_vistos || 0} episódios marcados como vistos</p>}
          <p style={{margin:0,color:"#8997B8",fontSize:10}}>{item.type==="episode" && item.source==="legacy" ? "Histórico anterior · sem data individual" : dateLabel(item.date)}</p>
        </div>
        <span aria-hidden="true" style={{fontSize:20}}>{item.type==="film"?"🎬":item.type==="episode"?"📺":item.type==="comment"?"💬":item.type==="rating"?"⭐":item.type==="series"?"🏆":"🍿"}</span>
      </article>)}
    </section>
    <BottomNav/>
  </main>
}
