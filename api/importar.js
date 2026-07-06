import { createClient } from '@supabase/supabase-js'

// COLA A URL E CHAVE REAL AQUI - SÓ PRA TESTE
const supabase = createClient(
  'https://pnwzbnmvpzipnlwrewjf.supabase.co', 
  'sb_secret_cUbmP...COLE_A_CHAVE_GIGANTE_AQUI...'
)

export default async function handler(req, res) {
  const teste = {
    id_tmdb: 1396,
    tipo: 'serie', 
    titulo: 'Breaking Bad',
    ano: 2008
  }

  const { data, error } = await supabase.from('titulos').insert(teste)

  if (error) {
    return res.status(500).json({ 
      ok: false,
      erro_supabase: error.message,
      codigo: error.code,
      msg: "HARDCODE TAMBÉM FALHOU"
    })
  }

  res.status(200).json({ ok: true, inseriu: data, msg: "HARDCODE FUNCIONOU!" })
}
