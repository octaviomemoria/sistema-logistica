const store = require('../store/inMemoryStore')

let nextId = 1

function list(req: any, res: any) {
  res.json(store.clients)
}

function create(req: any, res: any) {
  const body = req.body || {}
  // Para compatibilidade com versões anteriores, aceite 'name' ou 'fullName'/'tradeName'
  const displayName = body.name || body.fullName || body.tradeName || body.corporateName
  if (!displayName) return res.status(400).json({ error: 'name/fullName/tradeName is required' })
  const item = { id: nextId++, ...body }
  // Garanta um campo de visualização
  if (!item.name) item.name = displayName
  store.clients.push(item)
  res.status(201).json(item)
}

function remove(req: any, res: any) {
  const id = Number(req.params.id)
  const idx = store.clients.findIndex((c:any)=>c.id===id)
  if (idx===-1) return res.status(404).json({ error: 'not found' })
  store.clients.splice(idx,1)
  res.status(204).end()
}

function update(req: any, res: any) {
  const id = Number(req.params.id)
  const client = store.clients.find((c:any)=>c.id===id)
  if (!client) return res.status(404).json({ error: 'not found' })
  const patch = req.body || {}
  // atualização livre, mas com validações básicas de tipo para strings
  for (const [k,v] of Object.entries(patch)){
    if (['id'].includes(k)) continue
    if (v===undefined) continue
    client[k] = v
  }
  res.json(client)
}

module.exports = { list, create, remove, update }

export {}
