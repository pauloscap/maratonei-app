"use client"

import { useEffect, useState } from "react"

export default function ShareModal({
  title,
  subtitle,
  image,
  emoji = "🍿",
  message,
  accent = "#FFD400",
  heading = "Compartilhar",
  onClose,
  onShare,
  onDownload,
  downloading = false
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  async function handleCopy() {
    await onShare?.("copiar")
    setCopied(true)
  }

  return (
    <div
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}
      style={{
        position: "fixed", inset: 0, zIndex: 10020,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, background: "rgba(3,6,18,.82)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)"
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "min(88dvh, 760px)",
          overflowY: "auto", overscrollBehavior: "contain",
          background: "linear-gradient(160deg,#171f3d 0%,#0d142d 100%)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 24, padding: 20,
          boxShadow: "0 28px 90px rgba(0,0,0,.58)", color: "#fff"
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: accent, fontWeight: 900 }}>MARATONEI APP</div>
            <h2 style={{ margin: "4px 0 0", fontSize: 19, lineHeight: 1.2, fontWeight: 900 }}>{heading}</h2>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Fechar"
            style={{ flex: "0 0 38px", width: 38, height: 38, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.07)", color: "#fff", fontSize: 18, cursor: "pointer" }}
          >×</button>
        </header>

        <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 12, borderRadius: 18, background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ width: 86, height: 122, flex: "0 0 86px", borderRadius: 12, overflow: "hidden", background: "#080d20", border: `1px solid ${accent}66` }}>
            {image ? <img src={image} alt={title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 30 }}>{emoji}</div>}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 25, marginBottom: 7 }}>{emoji}</div>
            <div style={{ fontSize: 16, lineHeight: 1.25, fontWeight: 900, overflowWrap: "anywhere" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "#aab4d0", marginTop: 7, lineHeight: 1.4 }}>{subtitle}</div>}
            <div style={{ display: "inline-flex", marginTop: 10, padding: "5px 9px", borderRadius: 99, color: accent, background: `${accent}18`, fontSize: 9, fontWeight: 900, letterSpacing: .7 }}>MINHA MARATONA</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#cbd5e1" }}>MENSAGEM</span>
            <span style={{ fontSize: 10, color: "#7f8aa8" }}>Prévia do compartilhamento</span>
          </div>
          <div style={{ padding: 13, borderRadius: 14, background: "rgba(4,8,22,.55)", border: "1px solid rgba(255,255,255,.08)", color: "#dbe3f5", fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 116, overflowY: "auto" }}>{message}</div>
        </div>

        <div style={{ marginTop: 17 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#cbd5e1", marginBottom: 9 }}>COMPARTILHAR EM</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <button type="button" onClick={() => onShare?.("whatsapp")} style={{ minHeight: 46, border: 0, borderRadius: 13, background: "#20bd65", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>WhatsApp</button>
            <button type="button" onClick={() => onShare?.("twitter")} style={{ minHeight: 46, border: "1px solid rgba(255,255,255,.16)", borderRadius: 13, background: "#080b14", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>X / Twitter</button>
            <button type="button" onClick={handleCopy} style={{ minHeight: 46, border: "1px solid rgba(255,255,255,.13)", borderRadius: 13, background: copied ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.07)", color: copied ? "#86efac" : "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>{copied ? "✓ Copiado" : "⧉ Copiar mensagem"}</button>
            <button type="button" onClick={() => onDownload?.()} disabled={downloading} style={{ minHeight: 46, border: 0, borderRadius: 13, background: accent, color: "#080b18", fontSize: 12, fontWeight: 900, cursor: downloading ? "wait" : "pointer", opacity: downloading ? .65 : 1 }}>{downloading ? "Preparando imagem…" : "↓ Baixar imagem"}</button>
          </div>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button type="button" onClick={() => onShare?.("nativo")} style={{ width: "100%", minHeight: 46, marginTop: 9, border: "1px solid rgba(255,255,255,.12)", borderRadius: 13, background: "rgba(255,255,255,.07)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>Compartilhar pelo celular</button>
          )}
        </div>
        <div style={{ marginTop: 14, textAlign: "center", color: "#75809e", fontSize: 10, lineHeight: 1.4 }}>Mostre o que você está assistindo. Convide seus amigos para maratonar também.</div>
      </section>
    </div>
  )
}
