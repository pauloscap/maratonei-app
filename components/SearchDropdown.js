"use client"

export function SearchDropdown({ results, onAdd }) {
  if (!results.length) return null

  return (
    <div style={{
      position:"absolute", top:52, left:0, right:0,
      background:"#121B3A", borderRadius:16,
      border:"1px solid #ffffff18", zIndex:999,
      boxShadow:"0 16px 40px #0008", overflow:"hidden"
    }}>
      {results.map(r => {
        const isFilme = r.media_type === "movie"
        const title = isFilme? r.title : r.name
        const img = r.poster_path? `https://image.tmdb.org/t/p/w92${r.poster_path}` : ""
        const year = (isFilme? r.release_date : r.first_air_date)?.slice(0,4)
        const href = isFilme? `/filme/${r.id}` : `/serie/${r.id}`

        return (
          <div key={`${r.media_type}-${r.id}`} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"8px 10px", borderBottom:"1px solid #ffffff0d"
          }}>
            <a href={href} style={{
              display:"flex", alignItems:"center", gap:10,
              flex:1, textDecoration:"none", color:"#fff", minWidth:0
            }}>
              <img src={img} style={{ width:40, height:60, borderRadius:8, objectFit:"cover", background:"#0A0F25" }} alt="" />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:180 }}>{title}</div>
                <div style={{ fontSize:11, opacity:.45 }}>{year} • {r.vote_average?.toFixed(1)}★ {isFilme? "Filme":"Série"}</div>
              </div>
            </a>

            <button onClick={()=>onAdd(r,false)} style={{ height:30, padding:"0 12px", borderRadius:999, border:0, background:"#FFD400", color:"#000", fontWeight:800, fontSize:12, cursor:"pointer" }}>+ Adicionar</button>
          </div>
        )
      })}
    </div>
  )
}
