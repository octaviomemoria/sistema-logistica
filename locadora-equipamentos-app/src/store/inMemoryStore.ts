
// Store em memória (apenas para desenvolvimento / testes)
// Mantemos arrays simples para equipamentos, rentals, clients, products e contracts.
// Em um projeto real substituiremos por uma camada de persistência (DB).
const equipments: any[] = [];
const rentals: any[] = [];
const clients: any[] = [];
const products: any[] = [];
const contracts: any[] = [];

module.exports = {
  equipments,
  rentals,
  clients,
  products,
  contracts,
};

export {};
