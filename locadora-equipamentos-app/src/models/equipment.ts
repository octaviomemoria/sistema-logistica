// Modelo simples para um equipamento
// Aqui usamos uma classe apenas para agrupar propriedades básicas
// id: identificador numérico
// name: nome do equipamento
// available: booleano indicando se está disponível para aluguel
class Equipment {
  id: any;
  name: any;
  available: boolean;
  constructor(id: any, name: any, available = true) {
    this.id = id;
    this.name = name;
    this.available = available;
  }
}

module.exports = Equipment;

export {};
