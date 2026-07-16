"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const MAPA = { "101": 45582, "102": 71268, "103": 0, "104": 73, "201": 0, "301": 2993, "302": 61167 }

export default function DetalheSerie({ params }) {
  const id = String(params.id)
  const [userId, setUserId] = useState(null)
  const [serie, setSerie] = useState(null)
  const [status, setStatus] = useState("assistindo")
  const [epsVistos, setEpsVistos] = useState([])
  const [temporadas, setTemporadas] = useState([])
  const [aberta, setAberta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      const sess = await supabase.auth.getSession()
      if (!sess.data.session) { window.location.href = "/login"; return }
      const uid = sess.data.session.user.id
      setUserId(uid)

      const res = await supabase.from("user_series").select("*").eq("user_id", uid).eq("serie_id", id).single()
      const row = res.data
      let s = null
      if (row) s = { id: row.serie_id, titulo: row.titulo, ano: row.ano, img: row.img, q: row.q, status: row.status }
      if (!s) { try { const raw = localStorage.getItem(uid + ":serie-atual"); if (raw) s = JSON.parse(raw) } catch (e) {} }
      if (!s) s = { id: id, titulo: id, img: "" }
      setSerie(s)
      if (row && row.status) setStatus(row.status)
      else if (s.status) setStatus(s.status)
      const epsLocal = JSON.parse(localStorage.getItem(uid + ":eps-" + id) || "[]")
      if (row && row.eps_vistos) setEpsVistos(row.eps_vistos)
      else setEpsVistos(epsLocal)

      let rid = MAPA[id] || id
      if (!rid || rid === 0 || Number(rid) < 1000) {
        try {
          const q = s.q || s.titulo
          const sr = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))
          const sj = await sr.json()
          if (sj && sj[0] && sj[0].show) rid = sj[0].show.id
        } catch (e) {}
      }

      try {
        const a = await fetch("https://api.tvmaze.com/shows/" + rid)
        const b = await fetch("https://api.tvmaze.com/shows/" + rid + "/seasons")
        const c = await fetch("https://api.tvmaze.com/shows/" + rid + "/episodes")
        const show = await a.json()
        const seasons = await b.json()
        const episodes = await c.json()
        if (show && show.name) {
          const newImg = show.image? (show.image.original || show.image.medium) : s.img
          s = {...s, titulo: show.name, ano: show.premiered? show.premiered.slice(0,4) : "", img: newImg, banner: newImg }
          setSerie(s)
        }
        const mapa = {}
        if (Array.isArray(seasons)) { seasons.forEach(function(se){ mapa[se.number] = { numero: se.number, eps: [] } }) }
        if (Array.isArray(episodes)) { episodes.forEach(function(ep){ if (!mapa[ep.season]) mapa[ep.season] = { numero: ep.season, eps: [] }; mapa[ep.season].eps.push({ id: ep.id, numero: ep.number, nome: ep.name }) }) }
        const lista = Object.values(mapa).sort(function(x,y){ return x.numero - y.numero })
        const totalCalc = lista.reduce(function(acc,t){ return acc + t.eps.length }, 0)
        localStorage.setItem(uid + ":total-" + id, String(totalCalc))
        if (lista.length) { setTemporadas(lista); setAberta(lista[0].numero) }
        else { setTemporadas([{ numero:1, eps: [{ id: rid+"-1", numero:1, nome:"Episódio 1"}]}]); setAberta(1) }
      } catch (e) {
        setTemporadas([{ numero:1, eps: Array.from({length:10}, function(_,i){ return { id: rid+"-1-"+(i+1), numero:i+1, nome:"Episódio "+(i+1) } })}])
        setAberta(1)
        localStorage.setItem(uid + ":total-" + id, "10")
      }
      setLoading(false)
    }
    run()
  }, [id])

  async function toggleEp(eid){
    let novo
    if (epsVistos.includes(eid)) novo = epsVistos.filter(function(x){ return x!==eid })
    else novo = epsVistos.concat([eid])
    setEpsVistos(novo)
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }

  async function maratonarTemp(temp){
    const ids = temp.eps.map(function(e){ return e.id })
    const todos = ids.every(function(i){ return epsVistos.includes(i) })
    let novo
    if (todos) novo = epsVistos.filter(function(i){ return ids.indexOf(i)===-1 })
    else novo = Array.from(new Set(epsVistos.concat(ids)))
    setEpsVistos(novo)
    await supabase.from("user_series").update({ eps_vistos: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":eps-" + id, JSON.stringify(novo))
  }

  async function mudarStatus(novo){
    setStatus(novo)
    await supabase.from("user_series").update({ status: novo, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("serie_id", id)
    localStorage.setItem(userId + ":status-" + id, novo)
  }

  async function abandonar(){
    const nome = serie? serie.titulo : ""
    if (!confirm("Abandonar " + nome + "?")) return
    await supabase.from("user_series").delete().eq("user_id", userId).eq("serie_id", id)
    localStorage.removeItem(userId + ":status-" + id)
    localStorage.removeItem(userId + ":eps-" + id)
    localStorage.removeItem(userId + ":total-" + id)
    localStorage.removeItem(userId + ":serie-atual")
    window.location.href = "/"
  }

  const totalEps = useMemo(function(){ return temporadas.reduce(function(a,t){ return a + t.eps.length }, 0) }, [temporadas])
  const progresso = totalEps? Math.round((epsVistos.length/totalEps)*100) : 0
  if (!serie) return null

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff" }}>
      <div style={{ height:300, position:"relative", overflow:"hidden" }}>
        <img src={serie.banner || serie.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", background:"#12182F" }} />
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(180deg, rgba(0,0,0,0.2), #080B1F 95%)" }} />
        <button onClick={function(){ history.back() }} style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:999, background:"rgba(0,0,0,0.6)", border:"1px solid #ffffff22", color:"#fff" }}>{"<"}</button>
        <button onClick={abandonar} style={{ position:"absolute", top:14, right:14, padding:"7px 12px", borderRadius:999, background:"#ef4444", color:"#fff", fontSize:11, fontWeight:900 }}>Abandonar</button>
        <div style={{ position:"absolute", bottom:0, left:16, right:16, display:"flex", gap:12, alignItems:"flex-end", transform:"translateY(22px)" }}>
          <img src={serie.img} alt="" style={{ width:90, height:135, borderRadius:12, objectFit:"cover", border:"2px solid rgba(255,255,255,0.15)" }} />
          <div style={{ flex:1, paddingBottom:6 }}>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900 }}>{serie.titulo}</h1>
            <div style={{ fontSize:11, opacity:0.6, marginTop:4 }}>{loading? "carregando..." : temporadas.length + " temp - " + epsVistos.length + "/" + totalEps + " - " + progresso + "%"}</div>
            <div style={{ height:4, background:"rgba(255,255,255,0.1)", borderRadius:99, marginTop:8 }}><div style={{ width: progresso + "%", height:"100%", background:"#FFD400" }} /></div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"44px 14px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          <button onClick={function(){ mudarStatus("assistindo") }} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="assistindo"?"#FFD400":"#12182F", color: status==="assistindo"?"#000":"#fff", border:"1px solid #ffffff12" }}>Assistindo</button>
          <button onClick={function(){ mudarStatus("quero_assistir") }} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="quero_assistir"?"#FFD400":"#12182F", color: status==="quero_assistir"?"#000":"#fff", border:"1px solid #ffffff12" }}>Quero Assistir</button>
          <button onClick={function(){ mudarStatus("maratonei") }} style={{ padding:11, borderRadius:12, fontWeight:800, fontSize:12, background: status==="maratonei"?"#FFD400":"#12182F", color: status==="maratonei"?"#000":"#fff", border:"1px solid #ffffff12" }}>Maratonei</button>
        </div>

        <div style={{ background:"#12182F", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:12 }}>
          <b style={{ fontSize:13 }}>Temporadas {loading? "" : "- " + temporadas.length}</b>
          {temporadas.map(function(t){
            const vistos = t.eps.filter(function(e){ return epsVistos.includes(e.id) }).length
            const aberto = aberta===t.numero
            return (
              <div key={t.numero} style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:10, paddingTop:10 }}>
                <div onClick={function(){ setAberta(aberto? null : t.numero) }} style={{ display:"flex", justifyContent:"space-between", cursor:"pointer" }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>Temporada {t.numero} - {vistos}/{t.eps.length}</span>
                  <button onClick={function(e){ e.stopPropagation(); maratonarTemp(t) }} style={{ fontSize:10, padding:"4px 8px", borderRadius:99, background: vistos===t.eps.length?"#22c55e":"#FFD40018", color: vistos===t.eps.length?"#fff":"#FFD400" }}>{vistos===t.eps.length?"Desmarcar":"Maratonar"}</button>
                </div>
                {aberto && <div style={{ marginTop:8, display:"grid", gap:6 }}>{t.eps.map(function(ep){ const ok = epsVistos.includes(ep.id); return (<div key={ep.id} onClick={function(){ toggleEp(ep.id) }} style={{ display:"flex", gap:10, padding:"8px 10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", background: ok?"rgba(255,255,255,0.05)":"transparent", cursor:"pointer" }}><div style={{ width:18, height:18, borderRadius:5, border:"1px solid #ffffff33", background: ok?"#22c55e":"transparent", display:"grid", placeItems:"center", fontSize:10 }}>{ok?"✓":""}</div><div style={{ flex:1, fontSize:13 }}>{ep.numero}. {ep.nome}</div><div style={{ fontSize:10, opacity:0.4 }}>{ok?"Visto":"Marcar"}</div></div>)})}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
