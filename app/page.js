"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../lib/supabase"

export default function Home() {
  const [series, setSeries] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [progressMap, setProgressMap] = useState({})
  const [busca, setBusca] = useState("")
  const [resultados, setResultados] = useState([])
  const [mounted, setMounted] = useState(false)

  // 1. Carrega series do Supabase
  async function carregarSeries() {
    const { data } = await supabase.from("series").select("*").order("created_at", { ascending: false })
    if (data) setSeries(data)
  }

  // 2. Le localStorage SÓ no client
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

  // 3. Busca TMDB
  async function buscarTMDB(q) {
    setBusca(q)
    if (q.length < 2) { setResultados([]); return }
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=pt-BR&query=${q}`)
    const json = await res.json()
    setResultados(json.results?.slice(0, 6) || [])
  }

  // 4. FIX PRINCIPAL: Salvar na Home
  async function adicionarQueroAssistir(item) {
    // Evita duplicado
    const jaExiste = series.find(s => s.tmdb_id === item.id)
    if (jaExiste) {
      localStorage.setItem(`status-${jaExiste.id}`, "quero_assistir")
      if (!localStorage.getItem(`progress-${jaExiste.id}`)) {
        localStorage.setItem(`progress-${jaExiste.id}`, JSON.stringify([]))
      }
      carregarLocalStorage([...series])
      alert("Já estava na sua lista!")
      return
    }

    const novaSerie = {
      tmdb_id: item.id,
      titulo: item.name,
      ano: item.first_air_date? new Date(item.first_air_date).getFullYear() : null,
      sinopse: item.overview,
      poster: item.poster_path,
      nota: item.vote_average
    }

    const { data, error } = await supabase.from("series").insert([novaSerie]).select().single()

    if (error) {
      console.error(error)
      alert("Erro ao salvar no Supabase")
      return
    }

    // SALVA NO LOCALSTORAGE COM O ID DO SUPABASE (é o que a Home usa)
    localStorage.setItem(`status-${data.id}`, "quero_assistir")
    localStorage.setItem(`progress-${data.id}`, JSON.stringify([]))

    // Atualiza UI na hora, sem F5
    const novaLista = [data,...series]
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

  const quero = series.filter(s =>!assistindo.find(a => a.id === s.id))

  return (
    <main className="p-4 max-w-5xl mx-auto">
      {/* sua navbar e input de busca aqui - mantenha o onChange={(e)=>buscarTMDB(e.target.value)} */}

      {/* Resultados da busca */}
      {resultados.length > 0 && (
        <div className="bg-zinc-900 p-4 rounded-xl mb-6">
          {resultados.map(r => (
            <div key={r.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
              <span>{r.name}</span>
              <button onClick={() => adicionarQueroAssistir(r)} className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold">
                + Quero assistir
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mt-6 mb-3">▶️ Assistindo</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {assistindo.map(s => (
          <Link key={s.id} href={`/serie/${s.id}`}>
            <img src={`https://image.tmdb.org/t/p/w300${s.poster}`} className="rounded-lg border-2 border-yellow-400" />
            <p className="text-sm mt-1">{s.titulo}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-3">⭐ Quero Assistir</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {quero.map(s => (
          <Link key={s.id} href={`/serie/${s.id}`}>
            <img src={`https://image.tmdb.org/t/p/w300${s.poster}`} className="rounded-lg" />
            <p className="text-sm mt-1">{s.titulo}</p>
          </Link>
        ))}
        {quero.length === 0 && <p className="opacity-60 text-sm">Nenhuma série ainda. Busque acima e clique em + Quero assistir</p>}
      </div>
    </main>
  )
}
