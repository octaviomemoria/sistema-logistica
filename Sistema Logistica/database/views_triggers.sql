-- ============================================
-- VIEWS, TRIGGERS E FUNÇÕES
-- Sistema Logística Inteligente
-- ============================================

-- ============================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER trigger_atualizar_updated_at_regioes
    BEFORE UPDATE ON regioes
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_clientes
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_vendedores
    BEFORE UPDATE ON vendedores
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_transportadoras
    BEFORE UPDATE ON transportadoras
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_motoristas
    BEFORE UPDATE ON motoristas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_veiculos
    BEFORE UPDATE ON veiculos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_pedidos
    BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_rotas
    BEFORE UPDATE ON rotas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_atualizar_updated_at_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

-- ============================================
-- TRIGGER: Registrar histórico de mudança de status
-- ============================================

CREATE OR REPLACE FUNCTION registrar_historico_status_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o status realmente mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO historico_status_pedidos (
            pedido_id,
            status_anterior,
            status_novo,
            observacao
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Atualização automática de status'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_historico_status
    AFTER UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION registrar_historico_status_pedido();

-- ============================================
-- VIEW: Dashboard de Pedidos (vw_pedidos_dashboard)
-- ============================================

CREATE OR REPLACE VIEW vw_pedidos_dashboard AS
SELECT 
    p.id,
    p.numero_pedido,
    p.numero_nf,
    p.data_pedido,
    p.data_faturamento,
    p.data_prevista_entrega,
    p.status,
    p.valor_total,
    p.peso_total_kg,
    p.tipo_frete,
    
    -- Cliente
    c.nome AS cliente_nome,
    c.codigo_erp AS cliente_codigo,
    c.cidade AS cliente_cidade,
    c.uf AS cliente_uf,
    
    -- Vendedor
    v.nome AS vendedor_nome,
    
    -- Região
    r.nome AS regiao_nome,
    r.tempo_entrega_padrao_dias,
    
    -- Separação (última)
    s.data_inicio AS separacao_inicio,
    s.data_fim AS separacao_fim,
    s.status AS separacao_status,
    us.nome AS separador_nome,
    
    -- Conferência (última)
    conf.data_hora AS conferencia_data,
    conf.aprovado AS conferencia_aprovada,
    uc.nome AS conferente_nome,
    
    -- Expedição
    exp.data_hora_expedicao,
    exp.numero_romaneio,
    
    -- Rota
    rt.nome AS rota_nome,
    rt.data_rota,
    rt.tipo AS rota_tipo,
    CASE 
        WHEN rt.tipo = 'frota_propria' THEN v2.placa
        ELSE NULL
    END AS veiculo_placa,
    CASE 
        WHEN rt.tipo = 'frota_propria' THEN m.nome
        ELSE NULL
    END AS motorista_nome,
    CASE 
        WHEN rt.tipo = 'transportadora' THEN t.nome
        ELSE NULL
    END AS transportadora_nome,
    
    -- Entrega
    e.data_hora_entrega,
    e.nome_recebedor,
    
    -- Cálculos de tempo
    CASE 
        WHEN p.status = 'entregue' THEN 
            EXTRACT(DAY FROM (e.data_hora_entrega - p.data_faturamento))
        WHEN exp.data_hora_expedicao IS NOT NULL THEN
            EXTRACT(DAY FROM (NOW() - exp.data_hora_expedicao))
        WHEN p.data_faturamento IS NOT NULL THEN
            EXTRACT(DAY FROM (NOW() - p.data_faturamento))
        ELSE NULL
    END AS dias_em_processo,
    
    -- Indicador de atraso
    CASE 
        WHEN p.status IN ('expedido', 'em_transito') AND 
             p.data_prevista_entrega < CURRENT_DATE THEN true
        WHEN p.status = 'faturado' AND 
             p.data_faturamento < (CURRENT_DATE - INTERVAL '3 days') THEN true
        ELSE false
    END AS em_atraso,
    
    p.observacoes,
    p.created_at,
    p.updated_at

FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN vendedores v ON p.vendedor_id = v.id
LEFT JOIN regioes r ON p.regiao_id = r.id
LEFT JOIN LATERAL (
    SELECT * FROM separacoes 
    WHERE pedido_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) s ON true
LEFT JOIN usuarios us ON s.separador_id = us.id
LEFT JOIN LATERAL (
    SELECT * FROM conferencias 
    WHERE pedido_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) conf ON true
LEFT JOIN usuarios uc ON conf.conferente_id = uc.id
LEFT JOIN expedicoes exp ON exp.pedido_id = p.id
LEFT JOIN rotas rt ON exp.rota_id = rt.id
LEFT JOIN veiculos v2 ON rt.veiculo_id = v2.id
LEFT JOIN motoristas m ON rt.motorista_id = m.id
LEFT JOIN transportadoras t ON rt.transportadora_id = t.id
LEFT JOIN entregas e ON e.pedido_id = p.id;

-- ============================================
-- VIEW: Pedidos com Atraso de Entrega
-- ============================================

CREATE OR REPLACE VIEW vw_entregas_atrasadas AS
SELECT 
    p.*,
    c.nome AS cliente_nome,
    r.nome AS regiao_nome,
    CURRENT_DATE - p.data_prevista_entrega AS dias_atraso
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN regioes r ON p.regiao_id = r.id
WHERE 
    p.status IN ('expedido', 'em_transito') 
    AND p.data_prevista_entrega < CURRENT_DATE
ORDER BY dias_atraso DESC;

-- ============================================
-- VIEW: Pedidos Pendentes de Expedição
-- ============================================

CREATE OR REPLACE VIEW vw_pedidos_pendentes_expedicao AS
SELECT 
    p.*,
    c.nome AS cliente_nome,
    r.nome AS regiao_nome,
    CURRENT_DATE - p.data_faturamento::date AS dias_desde_faturamento
FROM pedidos p
JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN regioes r ON p.regiao_id = r.id
WHERE 
    p.status IN ('faturado', 'aguardando_separacao', 'em_separacao', 'separado', 'conferido', 'aguardando_expedicao')
    AND p.data_faturamento IS NOT NULL
ORDER BY p.data_faturamento ASC;

-- ============================================
-- FUNÇÃO: Calcular tempo de expedição
-- ============================================

CREATE OR REPLACE FUNCTION fn_calcular_tempo_expedicao(p_pedido_id UUID)
RETURNS INTERVAL AS $$
DECLARE
    v_data_faturamento TIMESTAMP;
    v_data_expedicao TIMESTAMP;
BEGIN
    SELECT p.data_faturamento, e.data_hora_expedicao
    INTO v_data_faturamento, v_data_expedicao
    FROM pedidos p
    LEFT JOIN expedicoes e ON e.pedido_id = p.id
    WHERE p.id = p_pedido_id;
    
    IF v_data_faturamento IS NULL OR v_data_expedicao IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_data_expedicao - v_data_faturamento;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Calcular tempo de entrega
-- ============================================

CREATE OR REPLACE FUNCTION fn_calcular_tempo_entrega(p_pedido_id UUID)
RETURNS INTERVAL AS $$
DECLARE
    v_data_expedicao TIMESTAMP;
    v_data_entrega TIMESTAMP;
BEGIN
    SELECT e.data_hora_expedicao, ent.data_hora_entrega
    INTO v_data_expedicao, v_data_entrega
    FROM expedicoes e
    LEFT JOIN entregas ent ON ent.pedido_id = e.pedido_id
    WHERE e.pedido_id = p_pedido_id;
    
    IF v_data_expedicao IS NULL OR v_data_entrega IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_data_entrega - v_data_expedicao;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Obter próximo número de romaneio
-- ============================================

CREATE OR REPLACE FUNCTION fn_gerar_numero_romaneio()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_ultimo_numero INTEGER;
    v_novo_numero VARCHAR(50);
BEGIN
    -- Busca o último número de romaneio do dia
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(numero_romaneio FROM '\\d+$') AS INTEGER
            )
        ), 
        0
    )
    INTO v_ultimo_numero
    FROM rotas
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Gera novo número no formato ROM-YYYYMMDD-NNNN
    v_novo_numero := 'ROM-' || 
                     TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || 
                     '-' || 
                     LPAD((v_ultimo_numero + 1)::TEXT, 4, '0');
    
    RETURN v_novo_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Estatísticas do Dashboard
-- ============================================

CREATE OR REPLACE FUNCTION fn_estatisticas_dashboard()
RETURNS TABLE (
    pedidos_pendentes_expedicao BIGINT,
    pedidos_pendentes_atraso BIGINT,
    pedidos_expedidos_hoje BIGINT,
    pedidos_em_rota BIGINT,
    pedidos_entregues_hoje BIGINT,
    entregas_atrasadas BIGINT,
    tempo_medio_expedicao_horas NUMERIC,
    tempo_medio_entrega_horas NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Pedidos pendentes de expedição
        (SELECT COUNT(*) 
         FROM pedidos 
         WHERE status IN ('faturado', 'aguardando_separacao', 'em_separacao', 'separado', 'conferido', 'aguardando_expedicao')
        )::BIGINT AS pedidos_pendentes_expedicao,
        
        -- Pedidos pendentes há mais de 3 dias
        (SELECT COUNT(*) 
         FROM pedidos 
         WHERE status IN ('faturado', 'aguardando_separacao', 'em_separacao', 'separado', 'conferido', 'aguardando_expedicao')
         AND data_faturamento < (CURRENT_DATE - INTERVAL '3 days')
        )::BIGINT AS pedidos_pendentes_atraso,
        
        -- Pedidos expedidos hoje
        (SELECT COUNT(*) 
         FROM expedicoes 
         WHERE DATE(data_hora_expedicao) = CURRENT_DATE
        )::BIGINT AS pedidos_expedidos_hoje,
        
        -- Pedidos em rota
        (SELECT COUNT(*) 
         FROM pedidos 
         WHERE status IN ('expedido', 'em_transito')
        )::BIGINT AS pedidos_em_rota,
        
        -- Pedidosentregues hoje
        (SELECT COUNT(*) 
         FROM entregas 
         WHERE DATE(data_hora_entrega) = CURRENT_DATE
        )::BIGINT AS pedidos_entregues_hoje,
        
        -- Entregas atrasadas
        (SELECT COUNT(*) 
         FROM pedidos 
         WHERE status IN ('expedido', 'em_transito') 
         AND data_prevista_entrega < CURRENT_DATE
        )::BIGINT AS entregas_atrasadas,
        
        -- Tempo médio de expedição (em horas)
        (SELECT AVG(EXTRACT(EPOCH FROM (e.data_hora_expedicao - p.data_faturamento)) / 3600)
         FROM pedidos p
         JOIN expedicoes e ON e.pedido_id = p.id
         WHERE p.data_faturamento >= (CURRENT_DATE - INTERVAL '30 days')
        )::NUMERIC(10,2) AS tempo_medio_expedicao_horas,
        
        -- Tempo médio de entrega (em horas)
        (SELECT AVG(EXTRACT(EPOCH FROM (ent.data_hora_entrega - e.data_hora_expedicao)) / 3600)
         FROM expedicoes e
         JOIN entregas ent ON ent.pedido_id = e.pedido_id
         WHERE e.data_hora_expedicao >= (CURRENT_DATE - INTERVAL '30 days')
        )::NUMERIC(10,2) AS tempo_medio_entrega_horas;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIM DAS VIEWS E FUNÇÕES
-- ============================================
