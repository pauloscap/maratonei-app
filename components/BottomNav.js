"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href:"/", label:"Séries", icon:"M", id:"series" },
  { href:"/filmes", label:"Filmes", icon:"▶", id:"filmes" },
  { href:"/busca", label:"Busca", icon:"⌕", id:"busca" },
  { href:"/perfil", label:"Perfil", icon:"◐", id:"perfil" },
]

export function BottomNav() {
  const path = usePathname()

  const isActive = (href) => {
    if (href === "/") return path === "/"
    return path?.startsWith(href)
  }

  return (
    <nav style={{
      position:"fixed", left:0, right:0, bottom:0, zIndex:50,
      height:72, background:"rgba(10,18,42,0.96)",
      backdropFilter:"blur(16px)",
      borderTop:"1px solid #ffffff12",
      display:"flex", justifyContent:"space-around",
      alignItems:"center", padding:"0 8px 8px"
    }}>
      {items.map(it => {
        const active = isActive(it.href)
        return (
          <Link key={it.id} href={it.href} style={{
            textDecoration:"none", display:"flex",
            flexDirection:"column", alignItems:"center",
            gap:4, minWidth:64, padding:"6px 0",
            color: active? "#FFD400" : "#ffffff66",
            transition:".2s"
          }}>
            <div style={{
              width:28, height:28, borderRadius:10,
              background: active? "#FFD400" : "#ffffff10",
              color: active? "#000" : "#fff",
              display:"grid", placeItems:"center",
              fontWeight:900, fontSize:14
            }}>
              {it.icon}
            </div>
            <span style={{
              fontSize:10, fontWeight: active? 800:500,
              fontFamily:"Inter,sans-serif",
              letterSpacing:.2
            }}>
              {it.label}
            </span>
            {active && <div style={{ width:4, height:4, borderRadius:99, background:"#FFD400", marginTop:1 }} />}
          </Link>
        )
      })}
    </nav>
  )
}
