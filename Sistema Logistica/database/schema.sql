-- ============================================
-- SISTEMA LOGÍSTICA INTELIGENTE
-- Schema do Banco de Dados Supabase (PostgreSQL)
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para funcionalidades de geolocalização

-- ============================================
-- TIPOS ENUM
-- ============================================

-- Status do pedido
CREATE TYPE status_pedido AS ENUM (
    'faturado',
    'aguardando_separacao',
    'em_separacao',
    'separado',
    'em_conferencia',
    'conferido',
    'aguardando_expedicao',
    'expedido',
    'em_transito',
    'entregue',
    'cancelado'
);

-- Tipo de frete
CREATE TYPE tipo_frete AS ENUM (
    'cif', -- Custo, seguro e frete por conta do vendedor
    'fob'  -- Frete por conta do comprador
);

-- Status da rota
CREATE TYPE status_rota AS ENUM (
    'planejada',
    'em_andamento',
    'concluida',
    'cancelada'
);

-- Tipo de rota
CREATE TYPE tipo_rota AS ENUM (
    'frota_propria',
    'transportadora'
);

-- Status de separação
CREATE TYPE status_separacao AS ENUM (
    'iniciada',
    'em_andamento',
    'concluida',
    'cancelada'
);

-- Perfil de usuário
CREATE TYPE perfil_usuario AS ENUM (
    'admin',
    'gestor',
    'separador',
    'conferente',
    'motorista'
);

-- ============================================
-- TABELA: regioes
-- Regiões de entrega para roteirização
-- ============================================
CREATE TABLE regioes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    cidades TEXT[], -- Array de cidades atendidas
    tempo_entrega_padrao_dias INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_regioes_uf ON regioes(uf);
CREATE INDEX idx_regioes_ativo ON regioes(ativo);

-- ============================================
-- TABELA: clientes
-- Cadastro de clientes da distribuidora
-- ============================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_erp VARCHAR(50) UNIQUE NOT NULL, -- Código do cliente no SAP
    nome VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj_cpf VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    email VARCHAR(100),
    telefone VARCHAR(20),
    
    -- Endereço
    cep VARCHAR(10),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    regiao_id UUID REFERENCES regioes(id),
    
    -- Coordenadas para roteirização
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clientes_codigo_erp ON clientes(codigo_erp);
CREATE INDEX idx_clientes_cnpj_cpf ON clientes(cnpj_cpf);
CREATE INDEX idx_clientes_regiao ON clientes(regiao_id);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);

-- ============================================
-- TABELA: vendedores
-- Vendedores responsáveis pelos pedidos
-- ============================================
CREATE TABLE vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_erp VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendedores_codigo_erp ON vendedores(codigo_erp);
CREATE INDEX idx_vendedores_ativo ON vendedores(ativo);

-- ============================================
-- TABELA: transportadoras
-- Transportadoras terceirizadas
-- ============================================
CREATE TABLE transportadoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    email VARCHAR(100),
    telefone VARCHAR(20),
    contato_responsavel VARCHAR(100),
    
    -- Regiões atendidas
    regioes_atendidas UUID[], -- Array de IDs de regiões
    
    -- Tabela de frete (JSON com configurações)
    tabela_frete JSONB, -- Exemplo: {"peso_ate_10kg": 15.00, "peso_ate_50kg": 35.00}
    
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transportadoras_cnpj ON transportadoras(cnpj);
CREATE INDEX idx_transportadoras_ativo ON transportadoras(ativo);

-- ============================================
-- TABELA: motoristas
-- Motoristas da frota própria
-- ============================================
CREATE TABLE motoristas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cnh VARCHAR(20) NOT NULL,
    categoria_cnh VARCHAR(5),
    validade_cnh DATE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    
    -- Referência ao usuário do sistema (para login no app)
    usuario_auth_id UUID, -- FK para auth.users do Supabase
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_motoristas_cpf ON motoristas(cpf);
CREATE INDEX idx_motoristas_ativo ON motoristas(ativo);

-- ============================================
-- TABELA: veiculos
-- Frota própria de veículos
-- ============================================
CREATE TABLE veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(100),
    marca VARCHAR(100),
    ano INTEGER,
    
    -- Capacidades
    capacidade_peso_kg DECIMAL(10, 2),
    capacidade_volume_m3 DECIMAL(10, 2),
    
    -- Motorista padrão
    motorista_padrao_id UUID REFERENCES motoristas(id),
    
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_veiculos_ativo ON veiculos(ativo);

-- ============================================
-- TABELA: pedidos
-- Pedidos de clientes
-- ============================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    numero_nf VARCHAR(50), -- Nota fiscal
    
    -- Datas
    data_pedido DATE NOT NULL,
    data_faturamento DATE,
    data_prevista_entrega DATE,
    
    -- Relacionamentos
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    vendedor_id UUID REFERENCES vendedores(id),
    regiao_id UUID REFERENCES regioes(id),
    
    -- Valores e pesos
    valor_total DECIMAL(12, 2),
    peso_total_kg DECIMAL(10, 2),
    volume_total_m3 DECIMAL(10, 2),
    quantidade_volumes INTEGER DEFAULT 1,
    
    -- Frete
    tipo_frete tipo_frete DEFAULT 'cif',
    valor_frete DECIMAL(10, 2),
    
    -- Status
    status status_pedido DEFAULT 'faturado',
    
    -- Observações
    observacoes TEXT,
    observacoes_entrega TEXT, -- Instruções específicas para entrega
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_numero_nf ON pedidos(numero_nf);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data_pedido ON pedidos(data_pedido);
CREATE INDEX idx_pedidos_data_faturamento ON pedidos(data_faturamento);

-- ============================================
-- TABELA: itens_pedido
-- Itens de cada pedido
-- ============================================
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    
    -- Produto
    codigo_produto VARCHAR(50) NOT NULL,
    descricao_produto VARCHAR(200) NOT NULL,
    codigo_barras VARCHAR(50), -- EAN/código de barras
    
    -- Quantidades
    quantidade DECIMAL(10, 2) NOT NULL,
    unidade_medida VARCHAR(10) DEFAULT 'UN',
    
    -- Valores
    valor_unitario DECIMAL(12, 2),
    valor_total DECIMAL(12, 2),
    
    -- Peso e volume
    peso_unitario_kg DECIMAL(10, 2),
    volume_unitario_m3 DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itens_pedido_pedido ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_codigo ON itens_pedido(codigo_produto);

-- ============================================
-- TABELA: rotas
-- Rotas de entrega planejadas
-- ============================================
CREATE TABLE rotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    data_rota DATE NOT NULL,
    
    -- Tipo e responsável
    tipo tipo_rota NOT NULL,
    veiculo_id UUID REFERENCES veiculos(id),
    motorista_id UUID REFERENCES motoristas(id),
    transportadora_id UUID REFERENCES transportadoras(id),
    
    -- Planejamento
    distancia_total_km DECIMAL(10, 2),
    tempo_estimado_minutos INTEGER,
    
    -- Status
    status status_rota DEFAULT 'planejada',
    
    -- Documentação
    numero_romaneio VARCHAR(50),
    
    -- Horários
    horario_saida_previsto TIMESTAMP WITH TIME ZONE,
    horario_saida_real TIMESTAMP WITH TIME ZONE,
    horario_retorno_previsto TIMESTAMP WITH TIME ZONE,
    horario_retorno_real TIMESTAMP WITH TIME ZONE,
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rotas_data ON rotas(data_rota);
CREATE INDEX idx_rotas_status ON rotas(status);
CREATE INDEX idx_rotas_tipo ON rotas(tipo);
CREATE INDEX idx_rotas_veiculo ON rotas(veiculo_id);
CREATE INDEX idx_rotas_motorista ON rotas(motorista_id);

-- ============================================
-- TABELA: rotas_pedidos
-- Relacionamento pedidos x rotas com sequência
-- ============================================
CREATE TABLE rotas_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    
    -- Sequência de entrega na rota
    sequencia_entrega INTEGER NOT NULL,
    
    -- Status específico do pedido na rota
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_entrega, entregue, nao_entregue
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(rota_id, pedido_id)
);

CREATE INDEX idx_rotas_pedidos_rota ON rotas_pedidos(rota_id);
CREATE INDEX idx_rotas_pedidos_pedido ON rotas_pedidos(pedido_id);

-- ============================================
-- TABELA: usuarios
-- Usuários internos do sistema
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Referência ao auth.users do Supabase
    
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    cargo VARCHAR(100),
    perfil perfil_usuario NOT NULL,
    
    -- Foto/avatar
    avatar_url TEXT,
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_user_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- ============================================
-- TABELA: separacoes
-- Registro de separação de pedidos
-- ============================================
CREATE TABLE separacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    separador_id UUID NOT NULL REFERENCES usuarios(id),
    
    -- Datas e horários
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status status_separacao DEFAULT 'iniciada',
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_separacoes_pedido ON separacoes(pedido_id);
CREATE INDEX idx_separacoes_separador ON separacoes(separador_id);
CREATE INDEX idx_separacoes_status ON separacoes(status);

-- ============================================
-- TABELA: itens_separacao
-- Itens separados com confirmação
-- ============================================
CREATE TABLE itens_separacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    separacao_id UUID NOT NULL REFERENCES separacoes(id) ON DELETE CASCADE,
    item_pedido_id UUID NOT NULL REFERENCES itens_pedido(id),
    
    -- Quantidade separada
    quantidade_separada DECIMAL(10, 2) NOT NULL,
    
    -- Confirmação via código de barras
    codigo_barras_conferido VARCHAR(50),
    data_hora_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itens_separacao_separacao ON itens_separacao(separacao_id);
CREATE INDEX idx_itens_separacao_item ON itens_separacao(item_pedido_id);

-- ============================================
-- TABELA: conferencias
-- Conferências finais antes da expedição
-- ============================================
CREATE TABLE conferencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    conferente_id UUID NOT NULL REFERENCES usuarios(id),
    
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprovado BOOLEAN NOT NULL,
    
    -- Divergências encontradas
    divergencias TEXT,
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conferencias_pedido ON conferencias(pedido_id);
CREATE INDEX idx_conferencias_conferente ON conferencias(conferente_id);

-- ============================================
-- TABELA: expedicoes
-- Registro de expedição/despacho
-- ============================================
CREATE TABLE expedicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    rota_id UUID REFERENCES rotas(id),
    
    data_hora_expedicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responsavel_id UUID REFERENCES usuarios(id),
    
    numero_romaneio VARCHAR(50),
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expedicoes_pedido ON expedicoes(pedido_id);
CREATE INDEX idx_expedicoes_rota ON expedicoes(rota_id);
CREATE INDEX idx_expedicoes_data ON expedicoes(data_hora_expedicao);

-- ============================================
-- TABELA: entregas
-- Comprovantes de entrega (POD - Proof of Delivery)
-- ============================================
CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    
    -- Data e localização
    data_hora_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Recebedor
    nome_recebedor VARCHAR(200),
    documento_recebedor VARCHAR(20),
    
    -- Comprovantes (URLs do Google Drive)
    assinatura_url TEXT,
    foto_comprovante_url TEXT,
    
    -- Motorista responsável
    motorista_id UUID REFERENCES motoristas(id),
    
    -- Ocorrências
    ocorrencia TEXT, -- Ex: "Cliente ausente", "Endereço não encontrado"
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entregas_pedido ON entregas(pedido_id);
CREATE INDEX idx_entregas_motorista ON entregas(motorista_id);
CREATE INDEX idx_entregas_data ON entregas(data_hora_entrega);

-- ============================================
-- TABELA: historico_status_pedidos
-- Log de mudanças de status dos pedidos
-- ============================================
CREATE TABLE historico_status_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    
    status_anterior status_pedido,
    status_novo status_pedido NOT NULL,
    
    usuario_id UUID REFERENCES usuarios(id),
    observacao TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historico_status_pedido ON historico_status_pedidos(pedido_id);
CREATE INDEX idx_historico_status_data ON historico_status_pedidos(created_at);

-- ============================================
-- FIM DO SCHEMA PRINCIPAL
-- ============================================
