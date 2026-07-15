"use client"
import { getSupa } from "./supabase"
const supa = getSupa()

export async function loadFilmes(setF) {
  try {
    const { data } = await supa.from("filmes").select("*").order("created_at", { ascending:false })
    if (data) setF(data)
  } catch {}
}

export function loadFilmesLS(list, setM) {
  let m = {}
  list.forEach(f => {
    const s = typeof window!== "undefined"? localStorage.getItem("filme-status-" + f.id) : null
    m[f.id] = s || "quero_assistir"
  })
  setM(m)
}

export async function buscarFilmeTMDB(v, setR) {
  if (v.length < 2) { setR([]); return }
  try {
    const key = process.env.NEXT_PUBLIC_TMDB_KEY
    const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${key}&language=pt-BR&query=${encodeURIComponent(v)}`)
    const j = await r.json()
    setR(j.results?.slice(0, 8) || [])
  } catch { setR([]) }
}
