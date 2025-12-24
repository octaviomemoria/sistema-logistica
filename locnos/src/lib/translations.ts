// Traduções do sistema Locnos para Português
export const translations = {
    // Status de pedidos
    status: {
        PENDING: 'PENDENTE',
        ASSIGNED: 'ATRIBUÍDO',
        DELIVERED: 'ENTREGUE',
        CANCELLED: 'CANCELADO',
        DRAFT: 'RASCUNHO',
        CONFIRMED: 'CONFIRMADO',
        IN_PROGRESS: 'EM ANDAMENTO',
        COMPLETED: 'CONCLUÍDO',
        AVAILABLE: 'DISPONÍVEL',
        IN_TRANSIT: 'EM TRÂNSITO',
        MAINTENANCE: 'MANUTENÇÃO'
    },

    // Mensagens comuns
    common: {
        delete: 'Excluir',
        edit: 'Editar',
        save: 'Salvar',
        cancel: 'Cancelar',
        create: 'Criar',
        update: 'Atualizar',
        search: 'Pesquisar',
        filter: 'Filtrar',
        all: 'Todos',
        loading: 'Carregando...',
        noData: 'Nenhum dado encontrado',
        confirmDelete: 'Tem certeza que deseja excluir?',
        success: 'Operação realizada com sucesso',
        error: 'Erro ao realizar operação'
    },

    // Pedidos
    orders: {
        title: 'Gestão de Pedidos',
        new: 'Novo Pedido',
        customer: 'Cliente',
        address: 'Endereço',
        city: 'Cidade',
        weight: 'Peso (kg)',
        status: 'Status',
        actions: 'Ações',
        createTitle: 'Criar Novo Pedido',
        customerName: 'Nome do Cliente',
        deliveryAddress: 'Endereço de Entrega',
        enterCustomer: 'Digite o nome do cliente',
        enterAddress: 'Digite o endereço de entrega',
        enterCity: 'Digite a cidade',
        enterWeight: 'Digite o peso em kg',
        creating: 'Criando...',
        createOrder: 'Criar Pedido',
        deleteConfirm: 'Tem certeza que deseja excluir este pedido?',
        deleteSuccess: 'Pedido excluído com sucesso',
        deleteFailed: 'Falha ao excluir pedido',
        updateFailed: 'Falha ao atualizar status',
        noOrders: 'Nenhum pedido encontrado'
    },

    // Veículos
    vehicles: {
        title: 'Gestão de Veículos',
        new: 'Novo Veículo',
        plate: 'Placa',
        model: 'Modelo',
        capacity: 'Capacidade (kg)',
        driver: 'Motorista',
        status: 'Status',
        addTitle: 'Adicionar Novo Veículo',
        licensePlate: 'Placa do Veículo',
        vehicleModel: 'Modelo do Veículo',
        driverName: 'Nome do Motorista (Opcional)',
        enterPlate: 'ABC-1234',
        enterModel: 'Ford Transit',
        enterDriver: 'João Silva',
        adding: 'Adicionando...',
        addVehicle: 'Adicionar Veículo',
        deleteConfirm: 'Tem certeza que deseja excluir o veículo',
        deleteVehicle: 'Excluir Veículo',
        changeStatus: 'Alterar Status',
        noVehicles: 'Nenhum veículo encontrado. Crie seu primeiro veículo para começar.',
        notAssigned: 'Não atribuído'
    },

    // Rotas
    routes: {
        title: 'Gestão de Rotas',
        planning: 'Planejamento de Rotas',
        availableOrders: 'Pedidos Disponíveis',
        routeDetails: 'Detalhes da Rota',
        selectVehicle: 'Selecionar Veículo',
        summary: 'Resumo',
        selectedOrders: 'Pedidos Selecionados',
        totalWeight: 'Peso Total',
        capacity: 'Capacidade',
        createRoute: 'Criar Rota',
        creating: 'Criando Rota...',
        noPendingOrders: 'Nenhum pedido pendente.',
        routeCreated: 'Rota criada com sucesso!',
        routeFailed: 'Falha ao criar rota'
    },

    // Dashboard
    dashboard: {
        title: 'Visão Geral',
        totalOrders: 'Total de Pedidos',
        pendingOrders: 'Pedidos Pendentes',
        assignedOrders: 'Pedidos Atribuídos',
        deliveredOrders: 'Pedidos Entregues',
        availableVehicles: 'Veículos Disponíveis',
        activeRoutes: 'Rotas Ativas',
        awaitingAssignment: 'Aguardando atribuição',
        quickStats: 'Estatísticas Rápidas',
        completionRate: 'Taxa de Conclusão',
        createOrder: 'Criar Pedido',
        addVehicle: 'Adicionar Veículo',
        planRoute: 'Planejar Rota',
        createOrderDesc: 'Adicionar novo pedido de entrega',
        addVehicleDesc: 'Cadastrar novo veículo',
        planRouteDesc: 'Otimizar rotas de entrega'
    },

    // Navegação
    nav: {
        home: 'Início',
        orders: 'Pedidos',
        vehicles: 'Veículos',
        routing: 'Roteirização',
        routes: 'Rotas'
    }
}
