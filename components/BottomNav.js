"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href:"/", label:"Início", icon:"⌂", id:"inicio" },
  { href:"/feed", label:"Amigos", icon:"◎", id:"amigos" },
  { href:"/busca", label:"Descobrir", icon:"⌕", id:"descobrir" },
  { href:"/series", label:"Séries", icon:"▣", id:"series" },
  { href:"/filmes", label:"Filmes", icon:"▶", id:"filmes" },
  { href:"/perfil", label:"Perfil", icon:"◐", id:"perfil" },
]

export function BottomNav() {
  const path = usePathname()

  const isActive = (href) => {
    if (href === "/") return path === "/"
    return path?.startsWith(href)
  }

  return (
    <nav aria-label="Navegação principal" style={{
      position:"fixed", left:0, right:0, bottom:0, zIndex:50,
      height:72, background:"rgba(10,18,42,0.97)",
      backdropFilter:"blur(16px)",
      borderTop:"1px solid #ffffff12",
      display:"flex", justifyContent:"space-around",
      alignItems:"center", padding:"0 3px 8px",
      paddingBottom:"max(8px, env(safe-area-inset-bottom))"
    }}>
      {items.map(it => {
        const active = isActive(it.href)
        return (
          <Link key={it.id} href={it.href} aria-current={active ? "page" : undefined} style={{
            textDecoration:"none", display:"flex",
            flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:4, flex:1, minWidth:0,
            padding:"6px 1px", color: active? "#FFD400" : "#ffffff66",
            transition:".2s"
          }}>
            <div style={{
              width:27, height:27, borderRadius:9,
              background: active? "#FFD400" : "#ffffff10",
              color: active? "#000" : "#fff",
              display:"grid", placeItems:"center",
              fontWeight:900, fontSize:15
            }}>
              {it.icon}
            </div>
            <span style={{
              fontSize:9, fontWeight: active? 800:500,
              fontFamily:"Inter,sans-serif", letterSpacing:0,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              maxWidth:"100%"
            }}>
              {it.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
