"use client"
import Link from "next/link"

function Card({ s, hl, pct, isM }) {
  const img = s.poster?.startsWith("/")
   ? `https://image.tmdb.org/t/p/w500${s.poster}` : s.poster || ""
  const m = isM(s.id)

  return (
    <Link href={`/serie/${s.id}`} style={{ textDecoration:"none", color:"#fff", minWidth:136 }}>
      <div style={{
        width:136, height:204, borderRadius:14, overflow:"hidden",
        background:"#121B3A", position:"relative",
        border: hl? "2px solid #FFD400" : "1px solid #ffffff12"
      }}>
        <img src={img} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
        <div style={{ position:"absolute", left:0, right:0, bottom:0, height:5, background:"#ffffff22" }}>
          <div style={{ width: pct(s.id)+"%", height:"100%", background: pct(s.id)===100? "#22c55e" : "#FFD400" }} />
        </div>
        {m && <div style={{ position:"absolute", top:6, right:6, width:20, height:20, borderRadius:999, background:"#FFD400", display:"grid", placeItems:"center", color:"#000", fontWeight:900, fontSize:11 }}>✓</div>}
        {hl && <div style={{ position:"absolute", top:6, left:6, padding:"2px 6px", borderRadius:999, background:"#FFD400", color:"#000", fontSize:9, fontWeight:900 }}>ASSISTINDO</div>}
      </div>
      <div style={{ fontSize:12.5, marginTop:7, maxWidth:136, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:600 }}>{s.titulo}</div>
    </Link>
  )
}

export function SectionRow({ title, color, list, pct, isM, hl }) {
  return (
    <>
      <h3 style={{ fontSize:15, fontWeight:800, margin:"16px 2px 10px", display:"flex", gap:8, alignItems:"center", fontFamily:"Sora,sans-serif" }}>
        <span style={{ width:4, height:15, background:color, borderRadius:99 }} /> {title}
        <span style={{ fontSize:12, opacity:.4, fontWeight:500 }}>• {list.length}</span>
      </h3>
      <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 2px 14px" }}>
        {list.length? list.map(s => <Card key={s.id} s={s} hl={hl} pct={pct} isM={isM} />)
          : <div style={{ opacity:.35, fontSize:13, padding:"10px 4px" }}>Nenhuma série aqui ainda</div>}
      </div>
    </>
  )
}
