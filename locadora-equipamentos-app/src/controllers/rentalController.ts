const Rental = require('../models/rental');
const store = require('../store/inMemoryStore');

// Contador simples para gerar ids de aluguel
let nextRentalId = 1;

// LISTAR todos os rentals
// GET /api/rentals
exports.list = (req: any, res: any) => {
  res.json(store.rentals);
};

// CRIAR um novo rental (aluguel)
// POST /api/rentals { equipmentId, customerName }
// Passos:
// 1) valida entrada
// 2) encontra o equipamento e checa disponibilidade
// 3) cria um Rental e marca equipamento como indisponível
exports.create = (req: any, res: any) => {
  const { equipmentId, customerName } = req.body;
  if (!equipmentId || !customerName) return res.status(400).json({ error: 'equipmentId and customerName required' });

  const eq = store.equipments.find((e: any) => e.id === equipmentId);
  if (!eq) return res.status(404).json({ error: 'equipment not found' });
  if (!eq.available) return res.status(400).json({ error: 'equipment not available' });

  const rental = new Rental(nextRentalId++, equipmentId, customerName, new Date().toISOString());
  store.rentals.push(rental);
  // marca equipamento como indisponível enquanto estiver alugado
  eq.available = false;
  res.status(201).json(rental);
};

// OBTER um aluguel por id
// GET /api/rentals/:id
exports.get = (req: any, res: any) => {
  const id = Number(req.params.id);
  const r = store.rentals.find((x: any) => x.id === id);
  if (!r) return res.status(404).json({ error: 'not found' });
  res.json(r);
};

// DEVOLVER um rental
// POST /api/rentals/:id/return
// Marca o rental como returned=true, seta endDate e marca o equipamento como disponível
exports.return = (req: any, res: any) => {
  const id = Number(req.params.id);
  const r = store.rentals.find((x: any) => x.id === id);
  if (!r) return res.status(404).json({ error: 'not found' });
  if (r.returned) return res.status(400).json({ error: 'already returned' });
  r.returned = true;
  r.endDate = new Date().toISOString();
  // marca equipamento disponível novamente
  const eq = store.equipments.find((e: any) => e.id === r.equipmentId);
  if (eq) eq.available = true;
  res.json(r);
};

// Helpers para teste/admin
exports.__setNextId = (v: number) => { nextRentalId = v; };
exports.__resetNextId = () => { nextRentalId = 1; };

export {};
