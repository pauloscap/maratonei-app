import Link from "next/link"

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || "4e44d9029b1273360df0be1de39768d1"
const SITE_URL = "https://www.maratoneiapp.com.br"

async function getSeries(id) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${encodeURIComponent(id)}?api_key=${TMDB_KEY}&language=pt-BR`, {
      next: { revalidate: 3600 }
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const series = await getSeries(id)
  const title = series?.name || "Série no Maratonei"
  const description = series?.overview || `Confira ${title} no Maratonei App e acompanhe sua próxima maratona.`
  const image = series?.poster_path
    ? `https://image.tmdb.org/t/p/w780${series.poster_path}`
    : `${SITE_URL}/og-mar atonei.png`.replace("og-mar atonei", "og-maratonei")

  return {
    title: `${title} | Maratonei App`,
    description,
    alternates: { canonical: `${SITE_URL}/compartilhar/serie/${id}` },
    openGraph: {
      type: "website",
      siteName: "Maratonei App",
      title: `${title} | Maratonei App`,
      description,
      url: `${SITE_URL}/compartilhar/serie/${id}`,
      images: [{ url: image, width: 780, height: 1170, alt: `Pôster de ${title}` }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Maratonei App`,
      description,
      images: [image]
    }
  }
}

export default async function ShareSeriesPage({ params }) {
  const { id } = await params
  const series = await getSeries(id)
  const title = series?.name || "Série no Maratonei"
  const image = series?.poster_path
    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
    : null

  return (
    <main style={{ minHeight: "100vh", background: "#080B1F", color: "#fff", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
        {image && <img src={image} alt={title} style={{ width: 180, maxHeight: 270, objectFit: "cover", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.45)" }} />}
        <div style={{ color: "#FFD400", fontSize: 12, fontWeight: 900, letterSpacing: 2, marginTop: 22 }}>MARATONEI APP</div>
        <h1 style={{ fontSize: 30, margin: "10px 0" }}>{title}</h1>
        <p style={{ color: "#b8c3df", lineHeight: 1.6 }}>{series?.overview || "Descubra, acompanhe e compartilhe suas séries favoritas."}</p>
        <Link href={`/serie/${encodeURIComponent(id)}`} style={{ display: "inline-block", marginTop: 16, padding: "13px 24px", borderRadius: 999, background: "#FFD400", color: "#080B1F", textDecoration: "none", fontWeight: 900 }}>
          Abrir no Maratonei
        </Link>
      </section>
    </main>
  )
}
