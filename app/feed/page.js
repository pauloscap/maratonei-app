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
      const ids = (relations || []).map(row => row.seguindo_id)
      setFollowing(ids)

      // A timeline usa check-ins existentes. Não consulta user_episodios,
      // tabela que ainda precisa de políticas RLS antes de ser usada no feed.
      const { data: checkins, error: checkinError } = await supabase
        .from("checkins").select("id,user_id,data,created_at")
        .order("created_at",{ascending:false}).limit(60)
      if (!active) return
      if (checkinError) {
        setError("Não foi possível carregar as atividades. As permissões de leitura podem precisar de configuração.")
        setLoading(false)
        return
      }
      const rows = checkins || []
      const profileIds = [...new Set(rows.map(row => row.user_id).filter(Boolean))]
      let profiles = []
      if (profileIds.length) {
        const { data } = await supabase.from("profiles")
          .select("id,username,nome,avatar_url").in("id",profileIds)
        profiles = data || []
      }
      if (!active) return
      const profileMap = Object.fromEntries(profiles.map(p => [p.id,p]))
      setItems(rows.map(row => ({...row,profile:profileMap[row.user_id] || null})))
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

  return <main style={{minHeight:"100vh",background:"#080F25",color:"#fff",paddingBottom:100,fontFamily:"Inter,sans-serif"}}>
    <header style={{padding:"22px 18px 16px",borderBottom:"1px solid #ffffff12",background:"#0b1430"}}>
      <div style={{maxWidth:760,margin:"0 auto"}}>
        <p style={{color:"#FFD400",fontSize:10,fontWeight:900,letterSpacing:2,margin:"0 0 6px"}}>MARATONEI SOCIAL</p>
        <h1 style={{fontSize:25,fontWeight:900,margin:0}}>Amigos</h1>
        <p style={{color:"#9CAACB",fontSize:12,margin:"7px 0 0"}}>Acompanhe as maratonas e descubra o que a comunidade está assistindo.</p>
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
      {!loading && userId && visible.length===0 && <div style={{padding:24,borderRadius:18,background:"#111b38",border:"1px solid #ffffff12",textAlign:"center"}}>
        <div style={{fontSize:34}}>🎬</div>
        <h2 style={{fontSize:17,margin:"10px 0 6px"}}>{tab==="seguindo"?"Seu feed está começando":"A comunidade está aquecendo"}</h2>
        <p style={{color:"#AAB4CE",fontSize:12,lineHeight:1.6}}>{tab==="seguindo"?"Siga outros maratoneiros para ver as atividades deles por aqui.":"Ainda não há check-ins visíveis para mostrar. Volte em breve para descobrir as maratonas da comunidade."}</p>
        <Link href="/busca" style={{display:"inline-block",marginTop:8,color:"#FFD400",fontWeight:900,fontSize:12,textDecoration:"none"}}>Descobrir pessoas →</Link>
      </div>}
      {!loading && visible.map(item => <article key={item.id} style={{display:"flex",gap:12,padding:15,marginBottom:10,borderRadius:16,background:"#111b38",border:"1px solid #ffffff12"}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:"#28365d",display:"grid",placeItems:"center",flexShrink:0,overflow:"hidden"}}>
          {item.profile?.avatar_url?.startsWith("http") ? <img src={item.profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontWeight:900,color:"#FFD400"}}>{(item.profile?.nome||item.profile?.username||"M").slice(0,1).toUpperCase()}</span>}
        </div>
        <div style={{minWidth:0,flex:1}}>
          <p style={{margin:"1px 0 5px",fontSize:12,color:"#E8ECF8",lineHeight:1.5}}><Link href={"/perfil/"+item.user_id} style={{color:"#FFD400",fontWeight:900,textDecoration:"none"}}>{item.profile?.nome||item.profile?.username||"Maratoneiro"}</Link>{" fez um check-in"}</p>
          <p style={{margin:0,color:"#8997B8",fontSize:10}}>{dateLabel(item.created_at||item.data)}</p>
        </div>
        <span aria-hidden="true" style={{fontSize:20}}>🍿</span>
      </article>)}
    </section>
    <BottomNav/>
  </main>
}
