import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 60 // Revalida a cada 60s

async function getSeries() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
  
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('nota', { ascending: false }) // Ordena por nota maior

  if (error) {
    console.error('Erro Supabase:', error)
    return []
  }
  return data
}

export default async function Home() {
  const series = await getSeries()

  return (
    <main style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 32, marginBottom: 30 }}>Maratonei.app.br</h1>
      
      <h2 style={{ marginBottom: 20 }}>Séries em Alta</h2>
      
      {series.length === 0 ? (
        <p>Nenhuma série importada ainda. Vai no <Link href="/admin">/admin</Link> e importa!</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: 20 
        }}>
          {series.map(serie => (
            <div key={serie.id} style={{ background: '#f5f5f5', borderRadius: 8, overflow: 'hidden' }}>
              {serie.poster && (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${serie.poster}`}
                  alt={serie.titulo}
                  style={{ width: '100%', height: 270, objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: 12 }}>
                <h3 style={{ fontSize: 16, margin: '0 0 8px 0' }}>{serie.titulo}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                  ⭐ {serie.nota?.toFixed(1)} | {serie.ano}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
