const store = require('../store/inMemoryStore');
const equipmentController = require('./equipmentController');
const rentalController = require('./rentalController');

exports.reset = (req: any, res: any) => {
  store.equipments.length = 0;
  store.rentals.length = 0;
  equipmentController.__resetNextId && equipmentController.__resetNextId();
  rentalController.__resetNextId && rentalController.__resetNextId();
  res.json({ ok: true });
};

exports.seed = (req: any, res: any) => {
  // simple seed
  store.equipments.length = 0;
  store.rentals.length = 0;
  equipmentController.__resetNextId && equipmentController.__resetNextId();
  rentalController.__resetNextId && rentalController.__resetNextId();
  const eq1 = { id: 1, name: 'Projetor', available: true };
  const eq2 = { id: 2, name: 'Microfone', available: true };
  store.equipments.push(eq1, eq2);
  equipmentController.__setNextId && equipmentController.__setNextId(3);
  res.json({ ok: true, equipments: store.equipments });
};

export {};
