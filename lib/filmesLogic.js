"use client"
import { getSupa } from "./supabase"
const supa = getSupa()

export async function loadFilmes(setF) {
  try {
    const { data } = await supa.from("filmes").select("*")
    if (data) setF(data)
  } catch {}
}

export function loadFilmesLS(list, setM) {
  let m = {}
  list.forEach(f => {
    const s = localStorage.getItem("filme-status-" + f.id)
    m[f.id] = s || "quero_assistir"
  })
  setM(m)
}

export async function buscarFilmeTMDB(v, setR) {
  if (v.length < 2) { setR([]); return }
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(v)}`
    )
    const j = await r.json()
    setR(j.results?.slice(0, 6) || [])
  } catch { setR([]) }
}

export async function addFilme(item, setF, F, router) {
  try {
    let { data: ex } = await supa.from("filmes").select("*").eq("tmdb_id", item.id).maybeSingle()
    if (ex) { router.push("/filme/" + ex.id); return }
    const n = {
      tmdb_id: item.id,
      titulo: item.title,
      poster: item.poster_path,
      ano: item.release_date? new Date(item.release_date).getFullYear() : null
    }
    const { data } = await supa.from("filmes").insert([n]).select().single()
    if (data) {
      localStorage.setItem("filme-status-" + data.id, "quero_assistir")
      router.push("/filme/" + data.id)
    }
  } catch (e) { alert(e.message) }
}
