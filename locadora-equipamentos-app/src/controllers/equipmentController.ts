const Equipment = require('../models/equipment');
const store = require('../store/inMemoryStore');

// nextId é um contador simples em memória usado para gerar novos ids
let nextId = 1;

// LISTAR equipamentos
// GET /api/equipments
// Retorna todos os equipamentos existentes no store em memória.
exports.list = (req: any, res: any) => {
  res.json(store.equipments);
};

// CRIAR um novo equipamento
// POST /api/equipments  { name }
// Valida que o nome foi enviado, cria uma instância e adiciona ao store.
exports.create = (req: any, res: any) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const eq = new Equipment(nextId++, name, true);
  store.equipments.push(eq);
  res.status(201).json(eq);
};

// OBTER um equipamento por id
// GET /api/equipments/:id
// Retorna 404 se não encontrado.
exports.get = (req: any, res: any) => {
  const id = Number(req.params.id);
  const eq = store.equipments.find((e: any) => e.id === id);
  if (!eq) return res.status(404).json({ error: 'not found' });
  res.json(eq);
};

// ATUALIZAR equipamento (nome e disponibilidade)
// PUT /api/equipments/:id  { name?, available? }
exports.update = (req: any, res: any) => {
  const id = Number(req.params.id);
  const eq = store.equipments.find((e: any) => e.id === id);
  if (!eq) return res.status(404).json({ error: 'not found' });
  const { name, available } = req.body;
  if (typeof name === 'string') eq.name = name;
  if (typeof available === 'boolean') eq.available = available;
  res.json(eq);
};

// Helpers usados por outros módulos (admin/seed, rentalController)
exports.__getById = (id: any) => store.equipments.find((e: any) => e.id === id);
exports.__getInternalList = () => store.equipments;
exports.__setNextId = (v: number) => { nextId = v; };
exports.__resetNextId = () => { nextId = 1; };

export {};
