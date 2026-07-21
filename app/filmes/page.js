"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)

const BASE_FILMES = [
  { id: "299534", titulo: "Vingadores: Ultimato", status: "maratonei" },
  { id: "272", titulo: "Batman", status: "quero_assistir" },
  { id: "82", titulo: "Game of Thrones", q: "Game of Thrones", status: "assistindo" },
]

export default function Filmes() {
  const [userId, setUserId] = useState("anon")
  const [busca, setBusca] = useState("")
  const [filmes, setFilmes] = useState([])
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [view, setView] = useState("grade")

  useEffect(() => {
    async function init() {
      const sess = await supabase.auth.getSession()
      if (!sess.data.session) { window.location.href = "/login"; return }
      const uid = sess.data.session.user.id
      setUserId(uid)
      const savedView = localStorage.getItem(uid + ":view-mode-filmes")
      if (savedView) setView(savedView)

      // tenta buscar do supabase, se não tiver usa BASE
      let res = await supabase.from("user_filmes").select("*").eq("user_id", uid).order("updated_at", { ascending: false })
      let lista = res.data
      if (!lista ||!lista.length) {
        // usa BASE temporario se tabela ainda nao tem nada
        const raw = JSON.parse(localStorage.getItem(uid + ":meus-filmes") || "null")
        lista = raw || BASE_FILMES.map(f=>({ filme_id: String(f.id), titulo: f.titulo, status: f.status }))
      }

      const comDados = await Promise.all(lista.map(async function(f){
        const fid = f.filme_id || f.id
        let img = f.img
        if (!img) {
          try {
            const q = f.q || f.titulo
            const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(q))
            const j = await r.json()
            img = j && j[0] && j[0].show && (j[0].show.image && (j[0].show.image.medium || j[0].show.image.original)) || ""
          } catch(e){}
        }
        const st = localStorage.getItem(uid + ":filme-status-" + fid) || f.status || "quero_assistir"
        const progresso = st==="maratonei"? 100 : st==="assistindo"? 45 : 0
        return { id: String(fid), titulo: f.titulo, img: img || "https://picsum.photos/seed/" + fid + "/400/600", status: st, progresso: progresso }
      }))
      setFilmes(comDados)
    }
    init()
  }, [])

  useEffect(function(){
    if (!busca.trim()) { setResultados([]); return }
    const t = setTimeout(async function(){
      setBuscando(true)
      try {
        const r = await fetch("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(busca))
        const j = await r.json()
        const lista = j.slice(0,8).map(function(item){ return { id: String(item.show.id), titulo: item.show.name, ano: item.show.premiered? item.show.premiered.slice(0,4):"", img: item.show.image? (item.show.image.medium || item.show.image.original) : "https://picsum.photos/seed/"+item.show.id+"/400/600" } })
        setResultados(lista)
      } catch(e){ setResultados([]) }
      setBuscando(false)
    }, 350)
    return function(){ clearTimeout(t) }
  }, [busca])

  function toggleView(){
    const novo = view==="grade"? "lista":"grade"
    setView(novo)
    localStorage.setItem(userId + ":view-mode-filmes", novo)
  }

  async function adicionarFilme(f){
    const novo = { id: String(f.id), titulo: f.titulo, img: f.img, status:"quero_assistir", progresso:0 }
    const novaLista = [novo].concat(filmes.filter(function(x){ return String(x.id)!==String(novo.id) }))
    setFilmes(novaLista)
    localStorage.setItem(userId + ":meus-filmes", JSON.stringify(novaLista))
    try { await supabase.from("user_filmes").upsert({ user_id: userId, filme_id: novo.id, titulo: novo.titulo, img: novo.img, status:"quero_assistir", updated_at: new Date().toISOString() }, { onConflict:"user_id,filme_id" }) } catch(e){}
    setBusca(""); setResultados([])
    window.location.href = "/filme/" + novo.id
  }

  function abrir(f){
    localStorage.setItem(userId + ":filme-atual", JSON.stringify(f))
    window.location.href = "/filme/" + f.id
  }

  const assistindo = filmes.filter(function(s){ return s.status==="assistindo" })
  const quero = filmes.filter(function(s){ return s.status==="quero_assistir" })
  const maratonei = filmes.filter(function(s){ return s.status==="maratonei" })

  function CardGrade(props){
    const s = props.s
    return (
      <div onClick={function(){ abrir(s) }} className="card-grade">
        <div className="poster-wrap">
          <img src={s.img} alt="" />
          <div className="badge">{s.status==="quero_assistir"? "QUERO" : s.status.toUpperCase()}</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: s.progresso+"%", background: s.status==="maratonei"? "#22c55e" : s.status==="quero_assistir"? "#8b5cf6":"#FFD400" }} /></div>
        </div>
        <div className="titulo">{s.titulo}</div>
      </div>
    )
  }

  function CardLista(props){
    const s = props.s
    return (
      <div onClick={function(){ abrir(s) }} style={{ display:"flex", gap:12, padding:10, background:"#12182F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, cursor:"pointer" }}>
        <div style={{ position:"relative" }}><img src={s.img} alt="" style={{ width:52, height:78, borderRadius:8, objectFit:"cover" }} /><div
