const store = require('../store/inMemoryStore')

let nextId = 1

function list(req: any, res: any) {
  res.json(store.contracts)
}

function create(req: any, res: any) {
  const { productId, clientId } = req.body
  if (!productId || !clientId) return res.status(400).json({ error: 'productId and clientId required' })
  const item = { id: nextId++, productId, clientId, startDate: new Date().toISOString() }
  store.contracts.push(item)
  // mark product as unavailable
  const prod = store.products.find((p:any)=>p.id===productId)
  if (prod) prod.available = false
  res.status(201).json(item)
}

function update(req: any, res: any) {
  const id = Number(req.params.id)
  const contract = store.contracts.find((c:any)=>c.id===id)
  if (!contract) return res.status(404).json({ error: 'not found' })
  const { productId, clientId } = req.body
  if (productId !== undefined && typeof productId !== 'number') return res.status(400).json({ error: 'invalid productId' })
  if (clientId !== undefined && typeof clientId !== 'number') return res.status(400).json({ error: 'invalid clientId' })
  if (typeof productId === 'number') {
    // update product availability: mark old product available and new one unavailable
    const oldProd = store.products.find((p:any)=>p.id===contract.productId)
    if (oldProd) oldProd.available = true
    const newProd = store.products.find((p:any)=>p.id===productId)
    if (newProd) newProd.available = false
    contract.productId = productId
  }
  if (typeof clientId === 'number') contract.clientId = clientId
  res.json(contract)
}

// End contract (set endDate and free product)
function end(req: any, res: any) {
  const id = Number(req.params.id)
  const contract = store.contracts.find((c:any)=>c.id===id)
  if (!contract) return res.status(404).json({ error: 'not found' })
  if (contract.endDate) return res.status(400).json({ error: 'already ended' })
  contract.endDate = new Date().toISOString()
  const prod = store.products.find((p:any)=>p.id===contract.productId)
  if (prod) prod.available = true
  res.json(contract)
}

module.exports = { list, create, update, end }

export {}
