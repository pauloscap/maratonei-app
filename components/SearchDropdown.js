"use client"
import { useRouter } from "next/navigation"

export function SearchDropdown({ results, onAdd }) {
  const router = useRouter()
  if (!results || !results.length) return null

  return (
    <div style={{
      position:"absolute", top:52, left:0, right:0,
      background:"#121B3A", borderRadius:16,
      border:"1px solid #ffffff18", zIndex:9999,
      boxShadow:"0 16px 40px #0008", overflow:"hidden"
    }}>
      {results.map(r => {
        // CORREÇÃO: se tem title é filme, mesmo sem media_type
        const isFilme = r.media_type === "movie" || (!r.media_type && !!r.title)
        const title = isFilme ? r.title : (r.name || r.title)
        const img = r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : ""
        const year = (isFilme ? r.release_date : r.first_air_date)?.slice(0,4)
        const id = r.id

        const goToDetail = (e) => {
          if (e) e.preventDefault()
          if (isFilme) {
            // Vai para /filme/123 - funciona sempre
            router.push(`/filme/${id}`)
          } else {
            // Série - usa a sua lógica que já funciona
            onAdd(r, true)
          }
        }

        const handleAdd = (e) => {
          e.stopPropagation()
          onAdd(r, false)
        }

        return (
          <div
            key={`${isFilme ? 'movie' : 'tv'}-${id}`}
            onClick={goToDetail}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"8px 10px", borderBottom:"1px solid #ffffff0d",
              cursor:"pointer"
            }}
          >
            <img src={img} style={{ width:40, height:60, borderRadius:8, objectFit:"cover", background:"#0A0F25", flexShrink:0 }} alt="" />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:180, color:"#fff" }}>{title}</div>
              <div style={{ fontSize:11, opacity:.45, color:"#fff" }}>{year} • {r.vote_average?.toFixed(1)}★ {isFilme? "Filme":"Série"}</div>
            </div>
            <button onClick={handleAdd} style={{ height:30, padding:"0 12px", borderRadius:999, border:0, background:"#FFD400", color:"#000", fontWeight:800, fontSize:12, cursor:"pointer", flexShrink:0 }}>+ Adicionar</button>
          </div>
        )
      })}
    </div>
  )
}
