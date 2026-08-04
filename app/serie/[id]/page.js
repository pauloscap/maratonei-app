"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams, useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"

export default function DetalheSerie() {
  const params = useParams()
  const router = useRouter()
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
      setLoading(true)
      setSerie(null)
      setTemporadas([])

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/login"); return }
      const uid = session.user.id
      setUserId(uid)

      const { data: row, error } = await supabase
     .from("user_series")
     .select("*")
     .eq("user_id", uid)
     .eq("serie_id", id)
     .maybeSingle()

      if (error ||!row) {
        console.error("Série não encontrada:", error)
        router.push("/")
        return
      }

      let s = {
        id: row.serie_id,
        titulo: row.titulo,
        ano: row.ano,
        img: row.img,
        q: row.q,
        status: row.status,
        origem: row.origem || "tmdb"
      }

      setSerie(s)
      setStatus(row.status || "assistindo")
      setEpsVistos(row.eps_vistos || [])

      try {
        let lista = []
        let updates = {}

        if (s.origem === "tmdb") {
          const details = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=pt-BR`, { cache: 'no-store' }).then(r=>r.json())
          if (details && details.name) {
            const newImg = details.poster_path? `https://image.tmdb.org/t/p/w500${details.poster_path}` : s.img
            const newTitulo = details.name
            const newAno = details.first_air_date? details.first_air_date.slice(0,4) : s.ano

            if (newImg!== s.img) updates.img = newImg
            if (newTitulo!== s.titulo) updates.titulo = newTitulo
            if (newAno!== s.ano) updates.ano = newAno

            s = {...s, titulo: newTitulo, ano: newAno, img: newImg, banner: newImg }
            setSerie(s)
          }
          if (details && details.seasons) {
            const seasonPromises = details.seasons.filter(se=>se.season_number>0).map(se=>
              fetch(`https://api.themoviedb.org/3/tv/${id}/season/${se.season_number}?api_key=${TMDB_KEY}&language=pt-BR`, { cache: 'no-store' }).then(r=>r.json())
            )
            const seasonsData = await Promise.all(seasonPromises)
            const mapa = {}
            seasonsData.forEach(se=>{
              mapa[se.season_number] = {
                numero: se.season_number,
                eps: se.episodes.map(ep=>({
                  id: String(ep.id),
                  numero: ep.episode_number,
                  nome: ep.name,
                  resumo: ep.overview? ep.overview.replace(/<[^>]+>/g,"").trim() : "Sem resumo disponível.",
                  img: ep.still_path? `https://image.tmdb.org/t/p/w300${ep.still_path}` : "",
                  runtime: ep.runtime || 0,
                  airdate: ep.air_date || ""
                }))
              }
            })
            lista = Object.values(mapa).sort((x,y) => x.numero - y.numero)
          }
        } else {
          const [a, b, c] = await Promise.all([
            fetch("https://api.tvmaze.com/shows/" + id, { cache: 'no-store' }),
            fetch("https://api.tvmaze.com/shows/" + id + "/seasons", { cache: 'no-store' }),
            fetch("https://api.tvmaze.com/shows/" + id + "/episodes", { cache: 'no-store' })
          ])
          const show = await a.json()
          const seasons = await b.json()
          const episodes = await c.json()
          if (show && show.name) {
            const newImg = show.image? (show.image.original || show.image.medium) : s.img
            const newTitulo = show.name
            const newAno = show.premiered? show.premiered.slice(0,4) : s.ano

            if (newImg!== s.img) updates.img = newImg
            if (newTitulo!== s.titulo) updates.titulo = newTitulo
            if (newAno!== s.ano) updates.ano = newAno

            s = {...s, titulo: newTitulo, ano: newAno, img: newImg, banner: newImg }
            setSerie(s)
          }
          const mapa = {}
          if (Array.isArray(seasons)) { seasons.forEach(se => { mapa[se.number] = { numero: se.number, eps: [] } }) }
          if (Array.isArray(episodes)) {
            episodes.forEach(ep => {
              if (!mapa[ep.season]) mapa[ep.season] = { numero: ep.season, eps: [] };
              mapa[ep.season].eps.push({
                id: String(ep.id),
                numero: ep.number,
                nome: ep.name,
                resumo: ep.summary? ep.summary.replace(/<[^>]+>/g,"").trim() : "Sem resumo disponível.",
                img: ep.image? (ep.image.medium || ep.image.original) : "",
                runtime: ep.runtime || 0,
                airdate: ep.airdate || ""
              })
            })
          }
          lista = Object.values(mapa).sort((x,y) => x.numero - y.numero)
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("user_series").update({
        ...updates,
            updated_at: new Date().toISOString()
          }).eq("user_id", uid).eq("serie_id", id)
        }

        const totalCalc = lista.reduce((acc,t) => acc + t.eps.length, 0)
        localStorage.setItem(uid + ":total-" + id, String(totalCalc))
        if (lista.length) { setTemporadas(lista); setAberta(lista[0].numero) }
        else { setTemporadas([{ numero:1, eps: [{ id: id+"-1", numero:
