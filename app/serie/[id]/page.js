"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

export default function SerieDetalhe() {
  const { id } = useParams()
  const router = useRouter()
  const [serie, setSerie] = useState(null)
  const [tmdb, setTmdb] = useState(null)
  const [temporadas, setTemporadas] = useState([])
  const [progress, setProgress] = useState([])
  const [status, setStatus] = useState("quero_assistir")
  const [aberta, setAberta] = useState(1)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("series").select("*").eq("id", id).single()
      if (!data) return
      setSerie(data)
      setStatus(localStorage.getItem("status-" + data.id) || "quero_assistir")
      const pg = localStorage.getItem("progress-" + data.id)
      if (pg) { try { setProgress(JSON.parse(pg)) } catch {} }

      if (data.tmdb_id) {
        const r = await fetch(`https://api.themoviedb.org/3/tv/${data.tmdb_id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR`)
        const j = await r.json()
        setTmdb(j)
        setTemporadas(j.seasons?.filter(s => s.season_number > 0) || [])
      }
    }
    if (id) load()
  }, [id])

  function salvarProgress(novo) {
    setProgress(novo)
    localStorage.setItem("progress-" + id, JSON.stringify(novo))
    localStorage.setItem("_ultima_atualizacao", Date.now().toString())
    if (novo.length > 0 && status === "quero_assistir") {
      setStatus("assistindo")
      localStorage.setItem("status-" + id, "assistindo")
    }
    // SE MARCAR 100% DOS EPS, VIRA JA MARATONEI AUTOMATICO
    if (tmdb?.number_of_episodes && novo.length >= tmdb.number_of_episodes) {
      setStatus("ja_maratonei")
      localStorage.set
