"use client"
import { useEffect, useState } from "react"
import { getSupa } from "../../lib/supabase"
import { BottomNav } from "../../components/BottomNav"

const supa = getSupa()

function hojeISO() {
  return new Date().toISOString().slice(0,10)
}

function gerarCalendario() {
  const dias = []
  const hoje = new Date()
  for (let i=29; i>=0; i--) {
    const d = new Date()
    d.setDate(hoje.getDate() - i)
    dias.push(d.toISOString().slice(0,10))
  }
  return dias
}

export default function PerfilPage() {
  const [stats, setStats] = useState({ series:0, maratonadas:0, horas:0, nivel:1, xp:0 })
  const [checkins, setCheckins] = useState([])
  const [streak, setStreak] = useState(0)
  const [conquistas, setConquistas] = useState([])

  useEffect(()=>{
    async function loadStats() {
      let seriesTotal = 0, filmesTotal = 0
      try {
        const { data: s } = await supa.from("series").select("id")
        const { data: f } = await supa.from("filmes").select("id")
        seriesTotal = s?.length || 0
        filmesTotal = f?.length || 0
      } catch {}

      // calcula horas e maratonadas do localStorage
      let maratonadas = 0, horas = 0
      try {
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i)
          if(k?.startsWith("status-") && localStorage.getItem(k)==="ja_assisti") maratonadas++
          if(k?.startsWith("filme-status-") && localStorage.getItem(k)==="ja_assisti") maratonadas++
          if(k?.startsWith("progress-")) {
            try { horas += JSON.parse(localStorage.getItem(k)||"[]").length * 0.7 } catch {}
          }
        }
      } catch {}

      const total = seriesTotal + filmesTotal
      const xp = maratonadas*100 + Math.floor(horas*5) + filmesTotal*30
      const nivel = Math.max(1, Math.floor(xp/150)+1)

      setStats({ series: total, maratonadas, horas: Math.round(horas), nivel, xp })

      // checkins
      const c = JSON.parse(localStorage.getItem("checkins")||"[]")
      setCheckins(c)

      // streak
      let seq=0
      const hoje = new Date()
      for(let i=0;i<30;i++){
        const d = new Date(); d.setDate(hoje.getDate()-i)
        const iso = d.toISOString().slice(0,10)
        if(c.includes(iso)) seq++; else if(i>0) break
      }
      setStreak(seq)

      // conquistas semanais
      const lista = [
        { id:"first", nome:"Primeira Maratona", desc:"Assista 1 título", icon:"🏅", ok: maratonadas>=1 },
        { id:"3series", nome:"3 Séries Assistindo", desc:"Tenha 3 em acompanhamento", icon:"🔥", ok: total>=3 },
        { id:"50h", nome:"50h de maratona", desc:"Acumule 50 horas", icon:"👾", ok: horas>=50 },
        { id:"streak3", nome:"Fogo 3 Dias", desc:"Check-in 3 dias seguidos", icon:"⚡", ok: seq>=3 },
        { id:"streak7", nome:"Semana Imparável", desc:"7 dias seguidos", icon:"🏆", ok: seq>=7 },
        { id:"filme1", nome:"Cinéfilo", desc:"Primeiro filme fixado", icon:"🎬", ok: filmesTotal>=1 },
        { id:"colecionador", nome:"Colecionador", desc:"10 títulos salvos", icon:"💎", ok: total>=10 },
      ]
      setConquistas(lista)
    }
    loadStats()
  }, [])

  const fazerCheckin = () => {
    const h = hojeISO()
    if(checkins.includes(h)) return alert("Você já fez check-in hoje!")
    const novo = [...checkins, h]
    localStorage.setItem("checkins", JSON.stringify(novo))
    setCheckins(novo)
    setStreak(s=>s+1)
  }

  const calendario = gerarCalendario()

  return (
    <div style={{ minHeight:"100vh", background:"#080B1F", color:"#fff", paddingBottom:90, fontFamily:"Inter,Sora,sans-serif" }}>
      <header style={{ height:56, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid #ffffff0f", position:"sticky", top:0, background:"#080B1F", zIndex:5 }}>
        <b>Perfil</b>
      </header>

      <main style={{ maxWidth:560, margin:"0 auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Card Usuário */}
        <div style={{ background:"#12182F", border:"1px solid #ffffff12", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:18 }}>P</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800 }}>Você</div>
            <div style={{ fontSize:12, opacity:.5 }}>Nível {stats.nivel} • {stats.xp} XP</div>
            <div style={{ height:6, background:"#ffffff14", borderRadius:99, marginTop:6, overflow:"hidden" }}>
              <div style={{ width:`${(stats.xp%150)/1.5}%`, height:"100%", background:"#FFD400" }} />
            </div>
          </div>
          <button onClick={fazerCheckin} style={{ height:36, padding:"0 14px", borderRadius:999, border:0, background: checkins.includes(hojeISO())? "#22c55e":"#FFD400", color:"#000", fontWeight:800, cursor:"pointer" }}>
            {checkins.includes(hojeISO())? "✓ Feito" : "Check-in"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:"14px 10px", textAlign:"center" }}><div style={{ fontSize:18, fontWeight:900 }}>{stats.series}</div><div style={{ fontSize:11, opacity:.45 }}>Títulos</div></div>
          <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:"14px 10px", textAlign:"center" }}><div style={{ fontSize:18, fontWeight:900, color:"#FFD400" }}>{stats.maratonadas}</div><div style={{ fontSize:11, opacity:.45 }}>Maratonadas</div></div>
          <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:16, padding:"14px 10px", textAlign:"center" }}><div style={{ fontSize:18, fontWeight:900 }}>{stats.horas}h</div><div style={{ fontSize:11, opacity:.45 }}>Assistidas</div></div>
        </div>

        {/* Streak */}
        <div style={{ background:"linear-gradient(135deg,#1A2142,#12182F)", border:"1px solid #FFD40022", borderRadius:16, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontWeight:800, display:"flex", gap:6, alignItems:"center" }}>🔥 Sequência {streak} dias</div><div style={{ fontSize:11, opacity:.5, marginTop:2 }}>Faça check-in ao assistir filme ou série</div></div>
          <div style={{ fontSize:22 }}>{streak>=7? "🏆": streak>=3? "⚡":"🔥"}</div>
        </div>

        {/* Calendário */}
        <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:10 }}>Calendário de Maratona • Últimos 30 dias</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(10, 1fr)", gap:6 }}>
            {calendario.map(d=>{
              const feito = checkins.includes(d)
              const isHoje = d===hojeISO()
              return <div key={d} title={d} style={{ aspectRatio:"1", borderRadius:8, background: feito? "#22c55e" : "#ffffff0f", border: isHoje? "1.5px solid #FFD400":"1px solid transparent", display:"grid", placeItems:"center", fontSize:9, fontWeight:700, opacity: feito?1:.35 }}>{new Date(d).getDate()}</div>
            })}
          </div>
          <div style={{ fontSize:11, opacity:.35, marginTop:8 }}>Cada quadrado verde = 1 dia que você assistiu ou fez check-in. Complete 7 dias para desbloquear conquista semanal.</div>
        </div>

        {/* Conquistas */}
        <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:10 }}>🏆 Ranking & Conquistas</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {conquistas.map(c=>(
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:12, background: c.ok? "#ffffff08":"transparent", border:"1px solid #ffffff0a", opacity: c.ok?1:.55 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}><span>{c.icon}</span><div><div style={{ fontSize:13, fontWeight:700 }}>{c.nome}</div><div style={{ fontSize:11, opacity:.45 }}>{c.desc}</div></div></div>
                <div style={{ fontSize:11, fontWeight:800, color: c.ok? "#22c55e":"#ffffff55" }}>{c.ok? "Desbloqueada":"Bloqueada"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações */}
        <div style={{ background:"#12182F", border:"1px solid #ffffff10", borderRadius:18, padding:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:10 }}>⚙️ Configurações</div>
          <button onClick={()=>alert("Tema escuro é padrão. Tema claro em breve!")} style={{ width:"100%", textAlign:"left", height:44, borderRadius:12, border:"1px solid #ffffff10", background:"#ffffff06", color:"#fff", padding:"0 12px", marginBottom:8 }}>🎨 Tema • Escuro</button>
          <button onClick={()=>{ const n = Notification?.requestPermission(); if(n) n.then(p=>alert(p)) }} style={{ width:"100%", textAlign:"left", height:44, borderRadius:12, border:"1px solid #ffffff10", background:"#ffffff06", color:"#fff", padding:"0 12px", marginBottom:8 }}>🔔 Notificações semanais</button>
          <button onClick={()=>{ if(confirm("Apagar todos os dados locais? Isso não apaga do Supabase.")){ localStorage.clear(); location.reload() } }} style={{ width:"100%", textAlign:"left", height:44, borderRadius:12, border:"1px solid #ff5a5a22", background:"#ff5a5a10", color:"#ff9a9a", padding:"0 12px" }}>🗑️ Limpar progresso local</button>
          <div style={{ fontSize:10, opacity:.3, textAlign:"center", marginTop:10 }}>maratoneiapp.com.br • v2.0 gamificado</div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
