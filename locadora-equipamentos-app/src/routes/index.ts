const express = require('express');
const router = express.Router();

const equipmentController = require('../controllers/equipmentController');
const rentalController = require('../controllers/rentalController');
const adminController = require('../controllers/adminController');
const clientController = require('../controllers/clientController');
const productController = require('../controllers/productController');
const contractController = require('../controllers/contractController');

// Aqui definimos as rotas da API e relacionamos com os controllers.
// Convenção: prefixo /api é aplicado em src/app.ts, então estas rotas ficam acessíveis em /api/...

// Equipamentos (CRUD mínimo)
// GET  /api/equipments        -> lista todos
// POST /api/equipments        -> cria novo (body: { name })
// GET  /api/equipments/:id    -> obtém por id
// PUT  /api/equipments/:id    -> atualiza (name, available)
router.get('/equipments', equipmentController.list);
router.post('/equipments', equipmentController.create);
router.get('/equipments/:id', equipmentController.get);
router.put('/equipments/:id', equipmentController.update);

// Rentals (fluxo de aluguel)
// GET  /api/rentals           -> lista todos os aluguéis
// POST /api/rentals           -> cria aluguel (body: { equipmentId, customerName })
// GET  /api/rentals/:id       -> obtém aluguel por id
// POST /api/rentals/:id/return-> marca devolução do aluguel
router.get('/rentals', rentalController.list);
router.post('/rentals', rentalController.create);
router.get('/rentals/:id', rentalController.get);
router.post('/rentals/:id/return', rentalController.return);

// Admin (apenas para desenvolvimento/testes): seed/reset do store em memória
router.post('/admin/reset', adminController.reset);
router.post('/admin/seed', adminController.seed);

// Clients
router.get('/clients', clientController.list);
router.post('/clients', clientController.create);
router.delete('/clients/:id', clientController.remove);
router.put('/clients/:id', clientController.update);

// Products
router.get('/products', productController.list);
router.post('/products', productController.create);
router.delete('/products/:id', productController.remove);
router.put('/products/:id', productController.update);

// Contracts
router.get('/contracts', contractController.list);
router.post('/contracts', contractController.create);
router.put('/contracts/:id', contractController.update);
router.post('/contracts/:id/end', contractController.end);

module.exports = router;
