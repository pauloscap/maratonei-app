"use client"

export function SearchDropdown({ results, onAdd }) {
  if (!results.length) return null
  return (
    <div style={{
      position:"absolute", top:52, left:0, right:0,
      background:"#121B3A", borderRadius:16,
      border:"1px solid #ffffff18", zIndex:20,
      boxShadow:"0 16px 40px #0008", overflow:"hidden"
    }}>
      {results.map(r => {
        const img = r.poster_path
        ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : ""
        return (
          <div key={r.id} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"8px 10px", borderBottom:"1px solid #ffffff0d"
          }}>
            <button
              onClick={() => onAdd(r, true)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                flex:1, background:"none", border:0,
                color:"#fff", cursor:"pointer", textAlign:"left"
              }}
            >
              <img src={img} style={{
                width:40, height:60, borderRadius:8,
                objectFit:"cover", background:"#0A0F25"
              }} alt="" />
              <div style={{ minWidth:0 }}>
                <div style={{
                  fontSize:13, fontWeight:700,
                  whiteSpace:"nowrap", overflow:"hidden",
                  textOverflow:"ellipsis", maxWidth:180,
                  fontFamily:"Inter,sans-serif"
                }}>
                  {r.name}
                </div>
                <div style={{ fontSize:11, opacity:.45 }}>
                  {r.first_air_date?.slice(0,4)} • {r.vote_average?.toFixed(1)}★
                </div>
              </div>
            </button>
            <button
              onClick={() => onAdd(r, false)}
              style={{
                height:30, padding:"0 12px", borderRadius:999,
                border:0, background:"#FFD400", color:"#000",
                fontWeight:800, fontSize:12, cursor:"pointer"
              }}
            >
              + Adicionar
            </button>
          </div>
        )
      })}
    </div>
  )
}
