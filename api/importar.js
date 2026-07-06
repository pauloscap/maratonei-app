import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pnwzbnmvpzipnlwrewjf.supabase.co',
  'sb_secret_cUbmPT5VAJFppkLezqyjKA_LLSrXo8U'
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
      msg: "AINDA DEU RUIM"
    })
  }

  res.status(200).json({ ok: true, inseriu: data, msg: "FUNCIONOU CARALHO!" })
}
