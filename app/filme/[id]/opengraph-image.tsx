import { ImageResponse } from 'next/og'
export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY
  let titulo = 'Maratonei App'
  let poster = ''
  try{
    const r = await fetch(`https://api.themoviedb.org/3/movie/${params.id}?api_key=${TMDB_KEY}&language=pt-BR`, { next: { revalidate: 86400 } })
    const j = await r.json()
    titulo = j.title || titulo
    poster = j.poster_path? `https://image.tmdb.org/t/p/w500${j.poster_path}` : ''
  }catch{}
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#080B1F', padding: 40, alignItems: 'center', gap: 40 }}>
      {poster && <img src={poster} style={{ width: 340, height: 510, borderRadius: 20, objectFit: 'cover' }} />}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, color: '#FFD400', fontWeight: 800 }}>MARATONEI APP</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: 'white', marginTop: 10, lineHeight: 1.1 }}>{titulo}</div>
        <div style={{ fontSize: 28, color: '#8b9cc7', marginTop: 20 }}>Vem organizar seus filmes também!</div>
        <div style={{ fontSize: 22, color: '#ffffff55', marginTop: 20 }}>maratoneiapp.com.br</div>
      </div>
    </div>, size
  )
}
