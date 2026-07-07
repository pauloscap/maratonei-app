async function importarTitulo(item) {
  setImportando(item.id)
  try {
    const res = await fetch('/api/salvar-titulo', {  // <-- MUDEI AQUI
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    alert('Importado!')
  } catch (e) {
    alert('❌ Erro: ' + e.message)
  } finally {
    setImportando(null)
  }
}
