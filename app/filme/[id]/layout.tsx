export async function generateMetadata({ params }: { params: { id: string } }){
  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY
  try{
    const r = await fetch(`https://api.themoviedb.org/3/movie/${params.id}?api_key=${TMDB_KEY}&language=pt-BR`, { next: { revalidate: 86400 } })
    const j = await r.json()
    return {
      title: `${j.title} - Maratonei App`,
      description: `Vem organizar seus filmes também no Maratonei App! ${j.overview?.slice(0,100)}`,
      openGraph: {
        title: j.title,
        description: 'Vem organizar seus filmes também no Maratonei App!',
        images: [`/filme/${params.id}/opengraph-image`]
      }
    }
  }catch{
    return { title: 'Maratonei App' }
  }
}
export default function Layout({ children }: { children: React.ReactNode }){ return children }
