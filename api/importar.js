import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  // Teste com 1 filme só
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
      detalhe: error.details,
      dica_url: process.env.SUPABASE_URL,
      dica_chave_tamanho: process.env.SUPABASE_KEY?.length || 0
    })
  }

  res.status(200).json({ ok: true, inseriu: data })
}
