"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const BASE = [
  { id: "299534", titulo: "Vingadores Ultimato" },
  { id: "272", titulo: "Batman" },
  { id: "82", titulo: "The Last of Us" }
]

export default function FilmesPage() {
  const [uid, setUid] = useState("")
  const [view, setView] = useState("grade")
  const [busca, setBusca] = useState("")
  const [filmes, setFilmes] = useState([])
  const [res, setRes] = useState([])

  useEffect(() => {
    async function load() {
      const s = await supabase.auth.getSession()
      if (!s.data.session) { window.location.href = "/login"; return }
      const id = s.data.session.user.id
      setUid(id)
      const v = localStorage.getItem(id + ":view-filmes")
      if (v) setView(v)
      const salvos = JSON.parse(localStorage.getItem(id + ":meus-filmes") || "null")
      const lista = salvos || BASE.map(b=>({ id: b.id, titulo: b.titulo, img: "https://picsum.photos/seed/" + b.id + "/400/600", status:"quero_assistir", progresso:0 }))
      setFilmes(lista)
    }
    load()
  }, [])

  useEffect(() => {
    if (!busca) { setRes([]); return }
    const t = setTimeout(async () => {
      const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(busca))
      const j = await r.json()
      const out = j.slice(0,6).map(i=>({ id: String(i.show.id), titulo: i.show.name, img: i.show.image? i.show.image.medium : "https://picsum.photos/seed/"+i.show.id+"/400/600" }))
      setRes(out)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  function mudarView() {
    const n = view === "grade"? "lista" : "grade"
    setView(n)
    localStorage.setItem(uid + ":view-filmes", n)
  }

  function addFilme(f) {
    const novo = { id: f.id, titulo: f.titulo, img: f.img, status:"quero_assistir", progresso:0 }
    const nova = [novo].concat(filmes.filter(x=>x.id!==novo.id))
    setFilmes(nova)
    localStorage.setItem(uid + ":meus-filmes", JSON.stringify(nova))
    setBusca("")
    setRes([])
  }

  function abrir(f) {
    localStorage.setItem(uid + ":filme-atual", JSON.stringify(f))
    window.location.href = "/filme/" + f.id
  }

  return (
    <div className="page">
      <style>{`
       .page { min-height:100vh; background:#0A0F2A; color:#fff; padding-bottom:80px; }
       .top { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid #1a2142; position:sticky; top:0; background:#0A0F2A; z-index:10; }
       .search { background:#121A3A; border:1px solid #1e2a5a; border-radius:999px; display:flex; align-items:center; padding:0 14px; height:42px; max-width:420px; margin:14px auto; }
       .search input { flex:1; background:transparent; border:0; outline:none; color:#fff; }
       .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        @media(min-width:480px){.grid{ grid-template-columns:repeat(4,1fr); } }
        @media(min-width:768px){.grid{ grid-template-columns:repeat(5,1fr); gap:14px; } }
        @media(min-width:1024px){.grid{ grid-template-columns:repeat(6,1fr); } }
       .card { cursor:pointer; }
       .poster { width:100%; aspect-ratio:2/3; border-radius:12px; overflow:hidden; background:#12182F; position:relative; border:1px solid #1e2a5a; }
       .poster img { width:100%; height:100%; object-fit:cover; }
       .badge { position:absolute; top:6px; left:6px; background:#FFD400; color:#000; font-size:8px; font-weight:900; padding:3px 6px; border-radius:6px; }
       .bar { position:absolute; bottom:0; left:0; right:0; height:4px; background:#000; }
       .fill { height:100%; background:#FFD400; }
