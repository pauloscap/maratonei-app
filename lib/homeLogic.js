"use client"
import { getSupa } from "./supabase"
const supa = getSupa()

export async function loadSeries(setS) {
  try {
    const { data } = await supa.from("series").select("*")
    if (data && data.length) setS(data)
  } catch {}
}

export function loadLS(list, setM, setP) {
  let m = {}, p = {}
  list.forEach(x => {
    const a = localStorage.getItem("status-" + x.id)
    const b = localStorage.getItem("progress-" + x.id)
    m[x.id] = a || "quero_assistir"
    if (b) {
      try {
        const v = JSON.parse(b)
        if (Array.isArray(v)) p[x.id] = v
      } catch {}
    }
  })
  setM(m); setP(p)
}

export async function buscarTMDB(v, setR) {
  if (v.length < 2) { setR([]); return }
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(v)}`
    )
    const j = await r.json()
    setR(j.results? j.results.slice(0, 6) : [])
  } catch { setR([]) }
}

export async function addSerie(item, setS, S, setM, setP, router, go) {
  try {
    let { data: e } = await supa.from("series")
    .select("*").eq("tmdb_id", item.id).maybeSingle()
    if (!e) {
      const n = {
        tmdb_id: item.id,
        titulo: item.name,
        poster: item.poster_path,
        ano: item.first_air_date? new Date(item.first_air_date).getFullYear() : null
      }
      const { data } = await supa.from("series").insert([n]).select().single()
      e = data
    }
    if (!e) return
    localStorage.setItem("status-" + e.id, "quero_assistir")
    localStorage.setItem("progress-" + e.id, "[]")
    if (go) router.push("/serie/" + e.id)
    else { const L = [e,...S]; setS(L) }
  } catch (err) { alert(err.message) }
}
