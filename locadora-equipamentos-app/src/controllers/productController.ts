const store = require('../store/inMemoryStore')

let nextId = 1

function list(req: any, res: any) {
  res.json(store.products)
}

function create(req: any, res: any) {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const item = { id: nextId++, name, available: true }
  store.products.push(item)
  res.status(201).json(item)
}

function remove(req: any, res: any) {
  const id = Number(req.params.id)
  const idx = store.products.findIndex((p:any)=>p.id===id)
  if (idx===-1) return res.status(404).json({ error: 'not found' })
  store.products.splice(idx,1)
  res.status(204).end()
}

function update(req: any, res: any) {
  const id = Number(req.params.id)
  const prod = store.products.find((p:any)=>p.id===id)
  if (!prod) return res.status(404).json({ error: 'not found' })
  const { name, available } = req.body
  if (name !== undefined && typeof name !== 'string') return res.status(400).json({ error: 'invalid name' })
  if (available !== undefined && typeof available !== 'boolean') return res.status(400).json({ error: 'invalid available flag' })
  if (typeof name === 'string') prod.name = name
  if (typeof available === 'boolean') prod.available = available
  res.json(prod)
}

module.exports = { list, create, remove, update }

export {}
