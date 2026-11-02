"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

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
      const { data: auth, error: authError } = await supabase.auth.getSession()
      const viewer = auth?.session?.user?.id || null
      if (!active) return
      setUserId(viewer)

      if (authError || !viewer) {
        setLoading(false)
        return
      }

      const { data: relations, error: relationError } = await supabase
        .from("seguidores")
        .select("seguindo_id")
        .eq("seguidor_id", viewer)

      if (!active) return
      if (relationError) {
        setError("Não foi possível carregar sua lista de pessoas seguidas.")
        setLoading(false)
        return
      }

      const followedIds = (relations || []).map(row => row.seguindo_id)
      setFollowing(followedIds)

      // Somente ações públicas entram na timeline. Check-ins e listas de desejos ficam fora.
      const results = await Promise.all([
        supabase.from("feed_filmes")
          .select("id,user_id,filme_id,titulo,img,status,updated_at")
          .eq("status", "ja_assisti")
          .order("updated_at", { ascending: false })
          .limit(60),
        supabase.from("feed_series")
          .select("id,user_id,serie_id,titulo,img,status,eps_vistos,updated_at")
          .in("status", ["assistindo", "maratonei"])
          .order("updated_at", { ascending: false })
          .limit(60),
        supabase.from("user_avaliacoes")
          .select("id,user_id,serie_id,temporada_numero,episodio_numero,nota,comentario,created_at")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase.from("comentarios_episodios")
          .select("id,user_id,serie_id,temporada_numero,episodio_numero,comentario,created_at")
          .order("created_at", { ascending: false })
          .limit(60)
      ])

      if (!active) return
      const queryErrors = results.filter(result => result.error)
      if (queryErrors.length) {
        console.warn("Algumas fontes do feed não puderam ser carregadas:", queryErrors.map(result => result.error))
        setError("Algumas atividades ainda não aparecem porque as permissões de leitura estão em preparação.")
      }

      const [filmsResult, seriesResult, ratingsResult, commentsResult] = results
      const timeline = [
        ...(filmsResult.data || []).map(row => ({
          key: "film-" + row.id,
          user_id: row.user_id,
          type: "film",
          title: row.titulo,
          image: row.img,
          date: row.updated_at,
          href: "/filme/" + row.filme_id,
          action: "marcou como assistido o filme"
        })),
        ...(seriesResult.data || []).map(row => ({
          key: "series-" + row.id,
          user_id: row.user_id,
          type: "series",
          title: row.titulo,
          image: row.img,
          date: row.updated_at,
          href: "/serie/" + row.serie_id,
          action: row.status === "maratonei" ? "maratonou a série" : "está assistindo à série",
          detail: Array.isArray(row.eps_vistos) && row.eps_vistos.length
            ? row.eps_vistos.length + " episódios marcados como vistos"
            : null
        })),
        ...(ratingsResult.data || []).map(row => ({
          key: "rating-" + row.id,
          user_id: row.user_id,
          type: "rating",
          title: "Temporada " + row.temporada_numero + " • Episódio " + row.episodio_numero,
          date: row.created_at,
          href: "/serie/" + row.serie_id,
          action: "avaliou um episódio",
          detail: row.comentario,
          rating: row.nota
        })),
        ...(commentsResult.data || []).map(row => ({
          key: "comment-" + row.id,
          user_id: row.user_id,
          type: "comment",
          title: "Temporada " + row.temporada_numero + " • Episódio " + row.episodio_numero,
          date: row.created_at,
          href: "/serie/" + row.serie_id,
          action: "comentou em um episódio",
          detail: row.comentario
        }))
      ].filter(item => item.user_id && item.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 100)

      const profileIds = [...new Set(timeline.map(item => item.user_id))]
      let profiles = []
      if (profileIds.length) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id,username,nome,avatar_url")
          .in("id", profileIds)
        if (profileError) {
          console.warn("Não foi possível carregar perfis do feed:", profileError)
        }
        profiles = data || []
      }

      if (!active) return
      const profileMap = Object.fromEntries(profiles.map(profile => [profile.id, profile]))
      setItems(timeline.map(item => ({ ...item, profile: profileMap[item.user_id] || null })))
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  const visible = useMemo(() => tab === "seguindo"
    ? items.filter(item => following.includes(item.user_id))
    : items, [items, following, tab])

  function dateLabel(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? "Data não informada"
      : date.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })
  }

  function iconFor(type) {
    return ({ film: "🎬", series: "📺", episode: "🍿", rating: "⭐", comment: "💬" })[type] || "🍿"
  }

  return (
    <main style={{ minHeight: "100vh", background: "#080F25", color: "#fff", paddingBottom: 100, fontFamily: "Inter,sans-serif" }}>
      <header style={{ padding: "22px 18px 16px", borderBottom: "1px solid #ffffff12", background: "#0b1430" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ color: "#FFD400", fontSize: 10, fontWeight: 900, letterSpacing: 2, margin: "0 0 6px" }}>MARATONEI SOCIAL</p>
          <h1 style={{ fontSize: 25, fontWeight: 900, margin: 0 }}>Amigos</h1>
          <p style={{ color: "#9CAACB", fontSize: 12, margin: "7px 0 0" }}>Acompanhe as maratonas e descubra o que a comunidade está assistindo.</p>
        </div>
      </header>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "16px 14px" }}>
        <div role="tablist" aria-label="Feed" style={{ display: "flex", gap: 8, padding: 4, borderRadius: 14, background: "#111b38", marginBottom: 16 }}>
          <button role="tab" aria-selected={tab === "seguindo"} onClick={() => setTab("seguindo")} style={{ flex: 1, border: 0, borderRadius: 10, padding: 12, fontWeight: 900, fontSize: 12, background: tab === "seguindo" ? "#FFD400" : "transparent", color: tab === "seguindo" ? "#080F25" : "#AAB4CE" }}>Seguindo</button>
          <button role="tab" aria-selected={tab === "paraVoce"} onClick={() => setTab("paraVoce")} style={{ flex: 1, border: 0, borderRadius: 10, padding: 12, fontWeight: 900, fontSize: 12, background: tab === "paraVoce" ? "#FFD400" : "transparent", color: tab === "paraVoce" ? "#080F25" : "#AAB4CE" }}>Para você</button>
        </div>

        {!userId && !loading && (
          <div style={{ padding: 22, borderRadius: 18, background: "#111b38", textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>🍿</div>
            <h2 style={{ fontSize: 17, margin: "10px 0 6px" }}>Entre para fazer parte da comunidade</h2>
            <p style={{ color: "#AAB4CE", fontSize: 12, lineHeight: 1.6 }}>Faça login para acompanhar pessoas e participar do Maratonei Social.</p>
            <Link href="/login" style={{ display: "inline-block", marginTop: 8, padding: "11px 20px", borderRadius: 999, background: "#FFD400", color: "#080F25", fontWeight: 900, textDecoration: "none", fontSize: 12 }}>Entrar</Link>
          </div>
        )}

        {loading && <p style={{ color: "#AAB4CE", textAlign: "center", padding: 30 }}>Carregando atividades...</p>}
        {error && <p role="status" style={{ color: "#FDE68A", padding: 14, background: "#453816", borderRadius: 12, fontSize: 12 }}>{error}</p>}

        {!loading && userId && visible.length === 0 && (
          <div style={{ padding: 24, borderRadius: 18, background: "#111b38", border: "1px solid #ffffff12", textAlign: "center" }}>
            <div style={{ fontSize: 34 }}>🎬</div>
            <h2 style={{ fontSize: 17, margin: "10px 0 6px" }}>{tab === "seguindo" ? "Seu feed está começando" : "A comunidade está aquecendo"}</h2>
            <p style={{ color: "#AAB4CE", fontSize: 12, lineHeight: 1.6 }}>{tab === "seguindo" ? "Siga outros maratoneiros para ver as atividades deles por aqui." : "Ainda não há atividades públicas para mostrar. Volte em breve para descobrir as maratonas da comunidade."}</p>
            <Link href="/busca" style={{ display: "inline-block", marginTop: 8, color: "#FFD400", fontWeight: 900, fontSize: 12, textDecoration: "none" }}>Descobrir pessoas →</Link>
          </div>
        )}

        {!loading && visible.map(item => (
          <article key={item.key} style={{ display: "flex", gap: 12, padding: 15, marginBottom: 10, borderRadius: 16, background: "#111b38", border: "1px solid #ffffff12" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#28365d", display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden" }}>
              {item.profile?.avatar_url?.startsWith("http")
                ? <img src={item.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontWeight: 900, color: "#FFD400" }}>{(item.profile?.nome || item.profile?.username || "M").slice(0, 1).toUpperCase()}</span>}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: "1px 0 5px", fontSize: 12, color: "#E8ECF8", lineHeight: 1.5 }}>
                <Link href={"/perfil/" + item.user_id} style={{ color: "#FFD400", fontWeight: 900, textDecoration: "none" }}>{item.profile?.nome || item.profile?.username || "Maratoneiro"}</Link>
                {" " + item.action + " "}
                <Link href={item.href} style={{ color: "#fff", fontWeight: 800, textDecoration: "none" }}>{item.title}</Link>
              </p>
              {item.detail && <p style={{ margin: "6px 0", color: "#C3CBE0", fontSize: 12, lineHeight: 1.5 }}>{item.detail}</p>}
              {item.rating && <p style={{ margin: "4px 0", color: "#FFD400", fontSize: 11 }}>{"★".repeat(Math.max(0, Math.min(5, Number(item.rating))))}</p>}
              <p style={{ margin: 0, color: "#8997B8", fontSize: 10 }}>{dateLabel(item.date)}</p>
            </div>
            <span aria-hidden="true" style={{ fontSize: 20 }}>{iconFor(item.type)}</span>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  )
}
