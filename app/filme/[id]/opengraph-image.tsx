import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Maratonei App - Filme'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const id = params.id
  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY
  let titulo = 'Filme'
  let poster = ''

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=pt-BR`)
    const data = await res.json()
    if(data.title){
      titulo = data.title
      poster = data.poster_path? `https://image.tmdb.org/t/p/w500${data.poster_path}` : ''
    }
  } catch{}

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#080B1F', color: 'white', padding: 40 }}>
        <div style={{ display: 'flex', gap: 30 }}>
          {poster && <img src={poster} style={{ width: 300, height: 450, borderRadius: 16, objectFit: 'cover' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 60, fontWeight: 900 }}>🍿 {titulo}</div>
            <div style={{ fontSize: 28, opacity: 0.7, marginTop: 20 }}>Vem organizar seus filmes também!</div>
            <div style={{ fontSize: 24, color: '#FFD400', marginTop: 20, fontWeight: 800 }}>maratoneiapp.com.br</div>
          </div>
        </div>
      </div>
    ),
    {...size }
  )
}
