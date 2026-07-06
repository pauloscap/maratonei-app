import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  const teste = {
    id_tmdb: 1402, // MUDEI O ID PRA NÃO DAR DUPLICADO
    tipo: 'serie',
    titulo: 'The Walking Dead',
    ano: 2010
  }

  const { data, error } = await supabase.from('titulos').insert(teste)

  if (error) {
    return res.status(500).json({ ok: false, erro: error.message, codigo: error.code })
  }

  res.status(200).json({ ok: true, inseriu: data })
}
