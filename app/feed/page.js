"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function FeedPage() {
  const [tab, setTab] = useState("seguindo")
  const [userId, setUserId] = useState(null)
  const [following, setFollowing] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
        .from("seguidores").select("seguindo_id").eq("seguidor_id", viewer)
      if (!active) return
      if (relationError) {
        setError("Não foi possível carregar quem você segue.")
        setLoading(false)
        return
      }
      const ids = (relations || []).map(row => row.seguindo_id).filter(Boolean)
      setFollowing(ids)

      const [checkinResult, seriesResult, filmResult, socialResult] = await Promise.all([
        supabase.from("checkins").select("id,user_id,data,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("user_series").select("user_id,serie_id,titulo,ano,img,status,eps_vistos,updated_at").order("updated_at", { ascending: false }).limit(80),
        supabase.from("user_filmes").select("user_id,filme_id,titulo,img,status,data_assistido,updated_at").order("updated_at", { ascending: false }).limit(80),
        supabase.from("social_activities").select("*").order("created_at", { ascending: false }).limit(150)
      ])
      if (!active) return

      const queryError = checkinResult.error || seriesResult.error || filmResult.error || socialResult.error
      if (queryError) {
        setError("O feed não conseguiu acessar todas as atividades. Verifique as permissões públicas de leitura das listas e dos check-ins no Supabase.")
      }

      const activities = []
      const loggedKeys = new Set()
      ;(socialResult.data || []).forEach(row => {
        loggedKeys.add(row.actor_id + ":" + row.media_type + ":" + row.media_id)
        const types = {
          film_added: ["adicionou à lista", "Quero assistir"],
          film_watched: ["marcou como assistido", "Já assisti"],
          series_added: ["adicionou à lista", "Quero assistir"],
          series_started: ["começou a assistir", "Em andamento"],
          series_completed: ["maratonou", "Série concluída"],
          episode_watched: ["marcou como concluído um episódio de", "Episódio concluído"]
        }
        const [verb, detail] = types[row.activity_type] || ["teve uma atividade em", "Atualização"]
        const isEpisode = row.activity_type === "episode_watched"
        activities.push({
          id: "social-" + row.id, user_id: row.actor_id,
          kind: isEpisode ? "episodio" : row.media_type === "tv" ? "serie" : "filme",
          verb, date: row.created_at, title: row.title,
          poster: isEpisode ? (row.episode_image_url || row.poster_url) : row.poster_url,
          detail: isEpisode ? ("Temporada " + row.season_number + " · Episódio " + row.episode_number + (row.episode_title ? " · " + row.episode_title : "")) : detail,
          episodeTitle: row.episode_title,
          mediaId: row.media_id, mediaType: row.media_type,
          season: row.season_number, episode: row.episode_number
        })
      })
      ;(checkinResult.data || []).forEach(row => {
        activities.push({
          id: "checkin-" + row.id,
          user_id: row.user_id,
          kind: "checkin",
          verb: "fez um check-in",
          date: row.created_at || row.data,
          title: null,
          poster: null,
          detail: "Presença registrada no Maratonei"
        })
      })

      ;(seriesResult.data || []).forEach(row => {
        if (loggedKeys.has(row.user_id + ":tv:" + row.serie_id)) return
        const status = row.status || ""
        const episodes = Array.isArray(row.eps_vistos) ? row.eps_vistos.length : 0
        let verb = ""
        let detail = ""
        if (status === "quero_assistir") { verb = "adicionou à lista"; detail = "Quero assistir" }
        else if (status === "assistindo") { verb = "está acompanhando"; detail = episodes ? episodes + " episódios registrados" : "Começou uma nova maratona" }
        else if (status === "maratonei") { verb = "maratonou"; detail = episodes ? episodes + " episódios concluídos" : "Série concluída" }
        else if (episodes > 0) { verb = "avançou em"; detail = episodes + " episódios registrados" }
        if (verb) activities.push({
          id: "serie-" + row.user_id + "-" + row.serie_id,
          user_id: row.user_id, kind: "serie", verb, date: row.updated_at,
          title: row.titulo, poster: row.img, detail, href: "/series"
        })
      })

      ;(filmResult.data || []).forEach(row => {
        if (loggedKeys.has(row.user_id + ":movie:" + row.filme_id)) return
        let verb = ""
        let detail = ""
        if (row.status === "quero_assistir") { verb = "salvou na lista"; detail = "Quero assistir" }
        else if (row.status === "ja_assisti") { verb = "assistiu"; detail = "Filme marcado como assistido" }
        if (verb) activities.push({
          id: "filme-" + row.user_id + "-" + row.filme_id,
          user_id: row.user_id, kind: "filme", verb, date: row.data_assistido || row.updated_at,
          title: row.titulo, poster: row.img, detail, href: "/filmes"
        })
      })

      const userIds = [...new Set(activities.map(item => item.user_id))]
      const { data: profiles, error: profileError } = userIds.length
        ? await supabase.from("profiles").select("id,username,nome,avatar_url").in("id", userIds)
        : { data: [], error: null }
      if (!active) return
      if (profileError) setError("Algumas informações dos perfis não puderam ser carregadas.")
      const profileMap = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]))
      activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      setItems(activities.map(item => ({ ...item, profile: profileMap[item.user_id] || null })))
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const visible = useMemo(() => items.filter(item =>
    tab === "seguindo" ? following.includes(item.user_id) : true
  ), [items, following, tab])

  const dateLabel = value => {
    if (!value) return "Data não informada"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Data não informada"
    const diff = Math.max(0, Date.now() - date.getTime())
    if (diff < 60000) return "Agora"
    if (diff < 3600000) return Math.floor(diff / 60000) + " min atrás"
    if (diff < 86400000) return Math.floor(diff / 3600000) + " h atrás"
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  const iconFor = kind => kind === "serie" ? "▣" : kind === "filme" ? "▶" : kind === "episodio" ? "▤" : "✦"
  const accentFor = kind => kind === "serie" ? "#A78BFA" : kind === "filme" ? "#FB923C" : kind === "episodio" ? "#67D7E8" : "#D9B65A"

  return <main style={{ minHeight: "100vh", background: "#070B18", color: "#fff", paddingBottom: 110, fontFamily: "Inter,system-ui,sans-serif" }}>
    <header style={{ padding: "24px 18px 19px", borderBottom: "1px solid #ffffff12", background: "linear-gradient(135deg,#111C35,#0C1428)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ color: "#FFD45A", fontSize: 9, fontWeight: 900, letterSpacing: 2.3, margin: "0 0 8px" }}>MARATONEI SOCIAL</p>
        <h1 style={{ fontSize: 29, fontWeight: 950, letterSpacing: -1, margin: 0 }}>Amigos</h1>
        <p style={{ color: "#A5B1CA", fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" }}>As listas, descobertas e maratonas de quem você acompanha.</p>
      </div>
    </header>
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "17px 14px" }}>
      <div role="tablist" aria-label="Feed" style={{ display: "flex", gap: 7, padding: 4, borderRadius: 14, background: "#111A2D", marginBottom: 17, border: "1px solid #ffffff0d" }}>
        <button role="tab" aria-selected={tab === "seguindo"} onClick={() => setTab("seguindo")} style={{ flex: 1, border: 0, borderRadius: 10, padding: 12, fontWeight: 900, fontSize: 11, background: tab === "seguindo" ? "#FFD45A" : "transparent", color: tab === "seguindo" ? "#101522" : "#AAB4CE", cursor: "pointer" }}>Seguindo</button>
        <button role="tab" aria-selected={tab === "paraVoce"} onClick={() => setTab("paraVoce")} style={{ flex: 1, border: 0, borderRadius: 10, padding: 12, fontWeight: 900, fontSize: 11, background: tab === "paraVoce" ? "#FFD45A" : "transparent", color: tab === "paraVoce" ? "#101522" : "#AAB4CE", cursor: "pointer" }}>Para você</button>
      </div>

      {!userId && !loading && <div style={emptyStyle}><div style={{ fontSize: 34 }}>🍿</div><h2 style={emptyTitle}>Entre para fazer parte da comunidade</h2><p style={emptyText}>Faça login para acompanhar pessoas e participar do Maratonei Social.</p><Link href="/login" style={actionLink}>Entrar</Link></div>}
      {loading && <p style={{ color: "#AAB4CE", textAlign: "center", padding: 32 }}>Carregando atividades...</p>}
      {error && <p role="alert" style={{ color: "#FFC4C9", padding: 14, background: "#451A2B", borderRadius: 12, fontSize: 11, lineHeight: 1.6 }}>{error}</p>}

      {!loading && userId && visible.length === 0 && <div style={emptyStyle}>
        <div style={{ fontSize: 34 }}>🎬</div>
        <h2 style={emptyTitle}>{tab === "seguindo" ? "Seu feed está começando" : "A comunidade está aquecendo"}</h2>
        <p style={emptyText}>{tab === "seguindo" ? "Quando seus amigos salvarem filmes, começarem séries ou concluírem uma maratona, você verá tudo aqui." : "Ainda não há atividades públicas para mostrar."}</p>
        <Link href="/busca" style={actionLink}>Encontrar maratoneiros <span>→</span></Link>
      </div>}

      {!loading && visible.map(item => {
        const name = item.profile?.nome || item.profile?.username || "Maratoneiro"
        const accent = accentFor(item.kind)
        return <article key={item.id} style={{ display: "flex", gap: 12, padding: 14, marginBottom: 10, borderRadius: 17, background: "linear-gradient(110deg,#111A2D,#0D1527)", border: "1px solid #ffffff10" }}>
          <Link href={"/perfil/" + item.user_id} aria-label={"Ver perfil de " + name} style={{ width: 42, height: 42, borderRadius: "50%", background: "#263451", display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden", border: "1px solid #ffffff1a", textDecoration: "none" }}>
            {item.profile?.avatar_url?.startsWith("http") ? <img src={item.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 900, color: "#FFD45A" }}>{name.slice(0, 1).toUpperCase()}</span>}
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: "1px 0 5px", fontSize: 12, color: "#E8ECF8", lineHeight: 1.55 }}>
              <Link href={"/perfil/" + item.user_id} style={{ color: "#FFD45A", fontWeight: 900, textDecoration: "none" }}>{name}</Link>{" "}{item.verb}{item.title ? <> <strong style={{ color: "#FFFFFF" }}>{item.title}</strong></> : null}
            </p>
            {item.title && <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 9, padding: 8, borderRadius: 12, background: "#ffffff07", border: "1px solid #ffffff0b" }}>
              {item.poster?.startsWith("http") ? <img src={item.poster} alt="" style={{ width: item.kind === "episodio" ? 82 : 42, height: item.kind === "episodio" ? 48 : 60, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} /> : <div style={{ width: item.kind === "episodio" ? 82 : 42, height: item.kind === "episodio" ? 48 : 60, borderRadius: 6, background: "#263451", display: "grid", placeItems: "center", color: accent }}>{iconFor(item.kind)}</div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: accent, fontWeight: 900, letterSpacing: .8 }}>{item.kind === "episodio" ? "EPISÓDIO" : item.kind === "serie" ? "SÉRIE" : "FILME"}</div>
                <div style={{ fontSize: 11, color: "#DDE4F2", fontWeight: 700, marginTop: 3, lineHeight: 1.4 }}>{item.detail}</div>
                <div style={{ fontSize: 9, color: "#7886A4", marginTop: 4 }}>{dateLabel(item.date)}</div>
              </div>
            </div>}
            {!item.title && <p style={{ margin: 0, color: "#8997B8", fontSize: 10 }}>{item.detail} · {dateLabel(item.date)}</p>}
          </div>
          <span aria-hidden="true" style={{ fontSize: 18, color: accent, flexShrink: 0 }}>{iconFor(item.kind)}</span>
        </article>
      })}
    </section>
    <BottomNav />
  </main>
}

const emptyStyle = { padding: 25, borderRadius: 20, background: "radial-gradient(circle at 50% 0%,#1A2746,#10182B 65%)", border: "1px solid #ffffff12", textAlign: "center" }
const emptyTitle = { fontSize: 17, margin: "10px 0 6px", fontWeight: 900 }
const emptyText = { color: "#AAB4CE", fontSize: 12, lineHeight: 1.7, maxWidth: 330, margin: "0 auto" }
const actionLink = { display: "inline-flex", gap: 8, alignItems: "center", marginTop: 15, color: "#FFD45A", fontWeight: 900, fontSize: 11, textDecoration: "none" }
