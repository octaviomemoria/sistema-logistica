// Modelo simples para representar um aluguel (rental)
// id: identificador do aluguel
// equipmentId: id do equipamento alugado
// customerName: nome do cliente
// startDate: data/hora de início do aluguel
// endDate: data/hora de devolução (null enquanto não devolvido)
// returned: booleano indicando se já foi devolvido
class Rental {
  id: any;
  equipmentId: any;
  customerName: any;
  startDate: any;
  endDate: any;
  returned: boolean;
  constructor(id: any, equipmentId: any, customerName: any, startDate: any, endDate = null, returned = false) {
    this.id = id;
    this.equipmentId = equipmentId;
    this.customerName = customerName;
    this.startDate = startDate;
    this.endDate = endDate;
    this.returned = returned;
  }
}

module.exports = Rental;

export {};
