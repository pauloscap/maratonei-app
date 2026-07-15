"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

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
  function carregarLS(lista) {
    const sMap = {}
    const pMap = {}
    lista.forEach((s) => {
      const st = localStorage.getItem("status-" + s.id)
      const pg = localStorage.getItem("progress-" + s.id)
      if (st) sMap[s.id] = st
      if (pg) { try { pMap[s.id] = JSON.parse(pg) } catch {} }
    })
    setStatusMap(sMap)
    setProgressMap(pMap)
  }
  useEffect(() => { setMounted(true); carregarSeries() }, [])
  useEffect(() => { if (mounted && series.length) carregarLS(series) }, [mounted, series])

  async function buscar(q) {
    setBusca(q)
    if (q.length < 2) { setResultados([]); return }
    const r = await fetch("https://api.themoviedb.org/3/search/tv?api_key=" + process.env.NEXT_PUBLIC_TMDB_KEY + "&language=pt-BR&query=" + encodeURIComponent(q))
    const j = await r.json()
    setResultados(j.results ? j.results.slice(0, 6) : [])
  }

  async function addQuero(item) {
    const ja = series.find((s) => s.tmdb_id === item.id)
    if (ja) {
      localStorage.setItem("status-" + ja.id, "quero_assistir")
      if (!localStorage.getItem("progress-" + ja.id)) localStorage.setItem("progress-" + ja.id, JSON.stringify([]))
      carregarLS(series); setResultados([]); setBusca(""); return
    }
    const nova = { tmdb_id: item.id, titulo: item.name, ano: item.first_air_date ? new Date(item.first_air_date).getFullYear() : null, sinopse: item.overview, poster: item.poster_path, nota: item.vote_average }
    const { data, error } = await supabase.from("series").insert([nova]).select().single()
    if (error) { alert(error.message); return }
    localStorage.setItem("status-" + data.id, "quero_assistir")
    localStorage.setItem("progress-" + data.id, JSON.stringify([]))
    const lista = [data].concat(series)
    setSeries(lista); carregarLS(lista); setResultados([]); setBusca("")
  }

  if (!mounted) return null
  const assistindo = series.filter((s) => { const st = statusMap[s.id]; const pg = progressMap[s.id]; return st === "assistindo" || (pg && pg.length > 0) })
  const quero = series.filter((s) => !assistindo.find((a) => a.id === s.id))

  const Card = ({ s, comBorda }) => {
    const prog = progressMap[s.id] || []
    const pct = prog.length ? Math.min(100, prog.length * 5) : 0
    return (
      <Link href={"/serie/" + s.id} className="block w-[110px] md:w-[140px] shrink-0">
        <div className={"relative rounded-2xl overflow-hidden bg-[#132040] " + (comBorda ? "ring-2 ring-[#FFD400]" : "")}>
          <img src={s.poster ? "https://image.tmdb.org/t/p/w300" + s.poster : "/placeholder.png"} alt={s.titulo} className="w-full h-[156px] md:h-[190px] object-cover" />
          {comBorda && pct > 0 && <div className="absolute bottom-0 left-0 h-[4px] bg-[#FFD400]" style={{ width: pct + "%" }} />}
        </div>
        <p className="text-[12px] leading-tight mt-2 text-white/90 truncate">{s.titulo}</p>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#08162e] text-white pb-[88px]">
      <header className="sticky top-0 z-20 bg-[#08162e]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFD400] grid place-items-center text-[#08162e] font-black">M</div>
            <span className="font-extrabold tracking-tight text-[18px]">maratonei</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/estatisticas" className="w-9 h-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/15">📊</Link>
            <Link href="/ranking" className="w-9 h-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/15">🏆</Link>
            <Link href="/perfil" className="w-9 h-9 rounded-full bg-[#FFD400] text-[#08162e] grid place-items-center font-bold">P</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          <input value={busca} onChange={(e) => buscar(e.target.value)} placeholder="Buscar série..." className="w-full h-[44px] pl-10 pr-4 rounded-full bg-[#132040] border border-white/10 placeholder:text-white/40 outline-none focus:border-[#FFD400]/50" />
        </div>

        {resultados.length > 0 && (
          <div className="mt-3 bg-[#132040] border border-white/10 rounded-2xl overflow-hidden">
            {resultados.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0 border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={r.poster_path ? "https://image.tmdb.org/t/p/w92" + r.poster_path : ""} className="w-9 h-12 rounded-lg object-cover bg-white/10" alt="" />
                  <span className="truncate text-sm">{r.name}</span>
                </div>
                <button onClick={() => addQuero(r)} className="shrink-0 h-8 px-4 rounded-full bg-[#FFD400] text-[#08162e] text-xs font-extrabold">+ Quero assistir</button>
              </div>
            ))}
          </div>
        )}

        <section className="mt-7">
          <h2 className="text-[15px] font-bold mb-3">Estou assistindo</h2>
          {assistindo.length ? <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">{assistindo.map((s) => <Card key={s.id} s={s} comBorda />)}</div> : <div className="h-[96px] rounded-2xl border border-dashed border-white/10 grid place-items-center text-white/30 text-sm">Nenhuma série em andamento</div>}
        </section>

        <section className="mt-8">
          <h2 className="text-[15px] font-bold mb-3">Quero Assistir</h2>
          {quero.length ? <div className="flex gap-3 overflow-x-auto pb-2">{quero.map((s) => <Card key={s.id} s={s} />)}</div> : <p className="text-white/40 text-sm">Nenhuma série ainda. Busque acima e clique em <b className="text-white">+ Quero assistir</b></p>}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#08162e] border-t border-white/10">
        <div className="max-w-5xl mx-auto h-[72px] px-6 flex items-center justify-between">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#FFD400]"><span className="text-[20px]">📺</span><span className="text-[10px] font-bold">Séries</span></Link>
          <Link href="/filmes" className="flex flex-col items-center gap-1 text-white/40"><span className="text-[20px]">🎬</span><span className="text-[10px]">Filmes</span></Link>
          <button onClick={() => document.querySelector("input")?.focus()} className="flex flex-col items-center gap-1 text-white/40"><span className="text-[20px]">🔍</span><span className="text-[10px]">Buscar</span></button>
          <Link href="/perfil" className="flex flex-col items-center gap-1 text-white/40"><span className="text-[20px]">👤</span><span className="text-[10px]">Perfil</span></Link>
        </div>
      </nav>
    </div>
  )
}
