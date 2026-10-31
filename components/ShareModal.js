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
  storyLabel = "",
  storyImageMode = "poster",
  onClose,
  onShare,
  onDownload,
  downloading = false
}) {
  const [copied, setCopied] = useState(false)
  const [sharingStory, setSharingStory] = useState(false)

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

  async function handleInstagramStory() {
    if (sharingStory) return
    setSharingStory(true)
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Não foi possível preparar a imagem.")

      const bg = ctx.createLinearGradient(0, 0, 1080, 1920)
      bg.addColorStop(0, "#171f3d")
      bg.addColorStop(1, "#080b1f")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, 1080, 1920)
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, 1080, 16)

      if (storyLabel) {
        ctx.fillStyle = accent
        ctx.fillRect(300, 58, 480, 76)
        ctx.fillStyle = "#080b1f"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "bold 34px Arial, sans-serif"
        ctx.fillText(storyLabel, 540, 96)
        ctx.textBaseline = "alphabetic"
      }

      if (image) {
        try {
          const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(image)}`)
          if (!response.ok) throw new Error("Imagem indisponível")
          const bitmap = await createImageBitmap(await response.blob())
          if (storyImageMode === "episode") {
            const x = 48, y = 230, w = 984, h = 620
            const scale = Math.max(w / bitmap.width, h / bitmap.height)
            const sw = w / scale, sh = h / scale
            const sx = (bitmap.width - sw) / 2, sy = (bitmap.height - sh) / 2
            ctx.save()
            ctx.shadowColor = "rgba(0,0,0,.5)"
            ctx.shadowBlur = 34
            ctx.beginPath()
            ctx.roundRect(x, y, w, h, 30)
            ctx.clip()
            ctx.drawImage(bitmap, sx, sy, sw, sh, x, y, w, h)
            ctx.restore()
          } else {
            const maxW = 820
            const maxH = 1120
            const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height)
            const w = bitmap.width * scale
            const h = bitmap.height * scale
            const x = (1080 - w) / 2
            const y = 170 + (maxH - h) / 2
            ctx.save()
            ctx.shadowColor = "rgba(0,0,0,.45)"
            ctx.shadowBlur = 38
            ctx.drawImage(bitmap, x, y, w, h)
            ctx.restore()
          }
          bitmap.close?.()
        } catch {
          // A arte continua funcional mesmo se o poster não puder ser carregado.
        }
      }

      ctx.textAlign = "center"
      ctx.fillStyle = "#ffffff"
      ctx.font = "100px serif"
      ctx.fillText(emoji, 540, storyImageMode === "episode" ? 1065 : 1430)
      ctx.font = "bold 66px Arial, sans-serif"
      const safeTitle = String(title || "Minha maratona")
      const words = safeTitle.split(/\s+/)
      const lines = []
      let line = ""
      for (const word of words) {
        const test = line ? line + " " + word : word
        if (ctx.measureText(test).width > 900 && line) {
          lines.push(line)
          line = word
        } else line = test
      }
      if (line) lines.push(line)
      lines.slice(0, 2).forEach((item, index) => ctx.fillText(item, 540, (storyImageMode === "episode" ? 1165 : 1535) + index * 76))

      if (subtitle) {
        ctx.fillStyle = "#b8c3df"
        ctx.font = "34px Arial, sans-serif"
        ctx.fillText(String(subtitle).slice(0, 65), 540, storyImageMode === "episode" ? 1350 : 1715)
      }

      ctx.fillStyle = accent
      ctx.font = "bold 36px Arial, sans-serif"
      ctx.fillText("MARATONEI APP", 540, 1820)
      ctx.fillStyle = "rgba(255,255,255,.65)"
      ctx.font = "26px Arial, sans-serif"
      ctx.fillText("maratoneiapp.com.br", 540, 1865)

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error("Falha ao gerar a imagem.")), "image/png")
      })
      const file = new File([blob], "maratonei-story.png", { type: "image/png" })
      const shareData = { files: [file], title: title || "Maratonei App", text: message || "Confira minha maratona no Maratonei App!" }

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData)
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "maratonei-story.png"
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        window.alert("A imagem do Story foi salva. Abra o Instagram, crie um Story e selecione a imagem na galeria.")
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        window.alert("Não foi possível abrir o compartilhamento. Você pode baixar a imagem e publicá-la nos Stories.")
      }
    } finally {
      setSharingStory(false)
    }
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
          <div style={{ width: storyImageMode === "episode" ? 112 : 86, height: storyImageMode === "episode" ? 72 : 122, flex: storyImageMode === "episode" ? "0 0 112px" : "0 0 86px", borderRadius: 12, overflow: "hidden", background: "#080d20", border: `1px solid ${accent}66` }}>
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
          <button type="button" onClick={handleInstagramStory} disabled={sharingStory} style={{ width: "100%", minHeight: 50, marginBottom: 9, border: 0, borderRadius: 13, background: "linear-gradient(110deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: sharingStory ? "wait" : "pointer", opacity: sharingStory ? .7 : 1 }}>
            {sharingStory ? "Preparando Story…" : "◎ Compartilhar nos Stories do Instagram"}
          </button>
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
