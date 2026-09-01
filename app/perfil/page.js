"use client"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY)
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const TMDB_IMG_BIG = "https://image.tmdb.org/t/p/w500"

const hojeISO = ()=>new Date().toISOString().slice(0,10)
const ontemISO = ()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) }

function calcularStreak(datas){
  if(!datas.length) return { atual:0, quebrado:true }
  const set = new Set(datas)
  const hoje = hojeISO()
  const ontem = ontemISO()
  if(!set.has(hoje) &&!set.has(ontem)) return { atual:0, quebrado:true }
  let atual = 0
  let d = new Date()
  if(!set.has(hoje)) d.setDate(d.getDate()-1)
  while(true){
    const iso = d.toISOString().slice(0,10)
    if(set.has(iso)){ atual++; d.setDate(d.getDate()-1) } else break
  }
  return { atual, quebrado:false }
}

const CONQUISTAS = [
  { id:1, nome:"Pipoquinha", emoji:"🍿", min:1, max:7 },
  { id:2, nome:"Pipoca Média", emoji:"🍿", min:8, max:14 },
  { id:3, nome:"Baldão", emoji:"🪣", min:15, max:21 },
  { id:4, nome:"Ticket", emoji:"🎟️", min:22, max:28 },
  { id:5, nome:"Óculos 3D", emoji:"🕶️", min:29, max:35 },
  { id:6, nome:"Claquete", emoji:"🎬", min:36, max:42 },
  { id:7, nome:"Câmera", emoji:"🎥", min:43, max:49 },
  { id:8, nome:"Troféu", emoji:"🏆", min:50, max:56 },
  { id:9, nome:"Coroa", emoji:"👑", min:57, max:999 },
]

const PERSONAGENS_EMOJI = [
  { nome:"Wandinha", emoji:"🖤", cor:"#1a1a1a" },
  { nome:"Harry Potter", emoji:"⚡", cor:"#7a0000" },
  { nome:"Stitch", emoji:"👽", cor:"#2a7fff" },
  { nome:"Homem-Aranha", emoji:"🕷️", cor:"#b00000" },
  { nome:"Barbie", emoji:"💖", cor:"#ff69b4" },
  { nome:"Naruto", emoji:"🍥", cor:"#ff8c00" },
  { nome:"Luffy", emoji:"👒", cor:"#d00000" },
  { nome:"Pikachu", emoji:"⚡", cor:"#ffcc00" },
  { nome:"Batman", emoji:"🦇", cor:"#111111" },
  { nome:"Deadpool", emoji:"🗡️", cor:"#a00000" },
  { nome:"Grogu", emoji:"👶", cor:"#7ab000" },
  { nome:"Eleven", emoji:"🧇", cor:"#e00000" },
]

export default function Perfil(){
  const [user,setUser]=useState(null)
  const [nome,setNome]=useState("Carregando...")
  const [foto,setFoto]=useState("")
  const [fotoOriginal,setFotoOriginal]=useState("")
  const [avatarEmoji,setAvatarEmoji]=useState(null)
  const [cks,setCks]=useState([])
  const [streak,setStreak]=useState(0)
  const [streakQuebrado,setStreakQuebrado]=useState(false)
  const [showFoto,setShowFoto]=useState(false)
  const [showPuzzle,setShowPuzzle]=useState(false)
  const [posterReacher,setPosterReacher]=useState("")
  const [stats,setStats]=useState({t:0,n:1,xp:0, seriesTotal:0, filmesTotal:0, seriesMaratonadas:0, filmesVistos:0, horasSeries:0, horasFilmes:0})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    async function loadPoster(){
      try{
        // REACHER - TV ID 89844 - cartaz de setembro
        const r = await fetch(`https://api.themoviedb.org/3/tv/89844?api_key=${TMDB_KEY}&language=pt-BR`).then(x=>x.json())
        if(r?.poster_path) setPosterReacher(`${TMDB_IMG_BIG}${r.poster_path}`)
      }catch{}
    }
    loadPoster()
  },[])

  useEffect(()=>{
    (async()=>{
      const { data:{session} } = await supabase.auth.getSession()
      if(!session){ location.href="/login"; return }
      const u=session.user
      setUser(u)
      setNome(u.user_metadata?.full_name || u.email?.split("@")[0] || "Você")
      const avatarGmail = u.user_metadata?.avatar_url || ""
      setFotoOriginal(avatarGmail)
      setFoto(avatarGmail)
      const savedEmoji = localStorage.getItem(u.id+":avatar_emoji")
      if(savedEmoji) setAvatarEmoji(JSON.parse(savedEmoji))
      let { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", u.id).single()
      if(perfil){ if(perfil.nome) setNome(perfil.nome); if(perfil.avatar_url && perfil.avatar_url.startsWith("http")) setFoto(perfil.avatar_url) }
      const [ { data: checkinsData }, { data: filmes }, { data: series } ] = await Promise.all([
        supabase.from("checkins").select("data").eq("user_id", u.id).order("data",{ascending:true}),
        supabase.from("user_filmes").select("status, runtime").eq("user_id", u.id),
        supabase.from("user_series").select("status, eps_vistos").eq("user_id", u.id)
      ])
      const listaDatas = checkinsData?.map(c=>c.data) || []
      setCks(listaDatas)
      const { atual, quebrado } = calcularStreak(listaDatas)
      setStreak(atual); setStreakQuebrado(quebrado && listaDatas.length>0)
      const qtdFilmes = filmes?.length || 0
      const qtdSeries = series?.length || 0
      const filmesVistos = filmes?.filter(f=>f.status==="ja_assisti") || []
      const seriesMaratonadas = series?.filter(s=>s.status==="maratonei") || []
      let horasFilmes=0, horasSeries=0
      filmesVistos.forEach(f=>{ horasFilmes += (f.runtime || 120)/60 })
      series?.forEach(s=>{ const eps = Array.isArray(s.eps_vistos)? s.eps_vistos.length : 0; horasSeries += eps * 0.75 })
      const maratonados = filmesVistos.length + seriesMaratonadas.length
      const xp = (listaDatas.length*15) + (maratonados*100) + ((qtdFilmes+qtdSeries)*10) + (atual*5)
      const nivel = Math.max(1, Math.floor(xp/250)+1)
      setStats({ t:qtdFilmes+qtdSeries, n:nivel, xp, seriesTotal:qtdSeries, filmesTotal:qtdFilmes, seriesMaratonadas:seriesMaratonadas.length, filmesVistos:filmesVistos.length, horasSeries:Math.round(horasSeries), horasFilmes:Math.round(horasFilmes) })
      setLoading(false)
    })()
  },[])

  const doCheck = async()=>{
