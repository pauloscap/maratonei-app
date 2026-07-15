"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// CRIA O CLIENT AQUI DENTRO - NÃO PRECISA DE lib/supabase.js
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default function Home() {
  const [series, setSeries] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [progressMap, setProgressMap] = useState({})
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [mounted, setMounted] = useState(false)

  async function carregarSeries() {
    const { data } = await supabase.from("series").select("*").order("created_at", { ascending: false })
    if (data) setSeries(data)
  }

  function carregarLocalStorage(listaSeries) {
    const sMap = {}
    const pMap = {}
    listaSeries.forEach((s) => {
      const st = localStorage.getItem(`status-${s.id}`)
      const pg = localStorage.getItem(`progress-${s.id}`)
      if (st) sMap[s.id] = st
      if (pg) {
        try { pMap[s.id] = JSON.parse(pg) } catch {}
      }
    })
    setStatusMap(sMap)
    setProgressMap(pMap)
  }

  useEffect(() => {
    setMounted(true)
    carregarSeries()
  }, [])

  useEffect(() => {
    if (mounted && series.length > 0) {
      carregarLocalStorage(series)
    }
  }, [mounted, series])

  async function buscarTMDB(q) {
    setBusca(q)
    if (q.length < 2) { setResultados([]); return }
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${q}`)
    const json = await res.json()
    setResultados(json.results?.slice(0, 6) || [])
  }

  async function adicionarQueroAssistir(item) {
    const jaExiste = series.find(s => s.tmdb_id === item.id)
    if (jaExiste) {
      localStorage.setItem(`status-${jaExiste.id}`, "quero_assistir")
      if (!localStorage.getItem(`progress-${jaExiste.id}`)) {
        localStorage.setItem(`progress-${jaExiste.id}`, JSON.stringify([]))
      }
      carregarLocalStorage([...series])
      return
    }

    const novaSerie = {
      tmdb_id: item.id,
      titulo: item.name,
      ano: item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
      sinopse: item.overview,
      poster: item.poster_path,
      nota: item.vote_average
    }

    const { data, error } = await supabase.from("series").insert([novaSerie]).select().single()
    if (error) {
      console.error(error)
      alert("Erro ao salvar: " + error.message)
      return
    }

    localStorage.setItem(`status-${data.id}`, "quero_assistir")
    localStorage.setItem(`progress-${data.id}`, JSON.stringify([]))

    const novaLista = [data, ...series]
    setSeries(novaLista)
    carregarLocalStorage(novaLista)
    setResultados([])
    setBusca("")
  }

  if (!mounted) return null

  const assistindo = series.filter(s => {
    const st = statusMap[s.id]
    const pg = progressMap[s.id]
    return st === "assistindo" || (pg && pg.length > 0)
  })
  const quero = series.filter(s => !assistindo.find(a => a.id === s.id))

  return (
    <main className="p-4 max-w-5
