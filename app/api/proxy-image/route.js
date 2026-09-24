export async function GET(req){
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if(!url) return new Response('Sem url', { status: 400 })
  try{
    const r = await fetch(url)
    const buf = await r.arrayBuffer()
    return new Response(buf, {
      headers: {
        'Content-Type': r.headers.get('Content-Type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  }catch(e){
    return new Response('Erro', { status: 500 })
  }
}
