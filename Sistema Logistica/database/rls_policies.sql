-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Sistema Logística Inteligente
-- ============================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE separacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_separacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status_pedidos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: Admin tem acesso total
-- ============================================

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION eh_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios
        WHERE auth_user_id = auth.uid()
        AND perfil = 'admin'
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para pegar o perfil do usuário
CREATE OR REPLACE FUNCTION perfil_usuario()
RETURNS perfil_usuario AS $$
DECLARE
    v_perfil perfil_usuario;
BEGIN
    SELECT perfil INTO v_perfil
    FROM usuarios
    WHERE auth_user_id = auth.uid()
    AND ativo = true;
    
    RETURN v_perfil;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para pegar ID do usuário interno
CREATE OR REPLACE FUNCTION usuario_id()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM usuarios
    WHERE auth_user_id = auth.uid()
    AND ativo = true;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS: Tabelas de Cadastro (Leitura Geral)
-- ============================================

-- Clientes: Todos podem ler, apenas admin/gestor podem modificar
CREATE POLICY "Clientes: Leitura para todos autenticados" ON clientes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Clientes: Admin e Gestor podem inserir" ON clientes
    FOR INSERT TO authenticated
    WITH CHECK (eh_admin() OR perfil_usuario() = 'gestor');

CREATE POLICY "Clientes: Admin e Gestor podem atualizar" ON clientes
    FOR UPDATE TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

CREATE POLICY "Clientes: Apenas Admin pode deletar" ON clientes
    FOR DELETE TO authenticated
    USING (eh_admin());

-- Vendedores: Mesma lógica
CREATE POLICY "Vendedores: Leitura para todos" ON vendedores
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Vendedores: Admin e Gestor gerenciam" ON vendedores
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- Regiões: Leitura para todos
CREATE POLICY "Regiões: Leitura para todos" ON regioes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Regiões: Admin e Gestor gerenciam" ON regioes
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- Transportadoras
CREATE POLICY "Transportadoras: Leitura para todos" ON transportadoras
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Transportadoras: Admin e Gestor gerenciam" ON transportadoras
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- Motoristas
CREATE POLICY "Motoristas: Leitura para todos" ON motoristas
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Motoristas: Admin e Gestor gerenciam" ON motoristas
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- Motorista pode ver seus próprios dados
CREATE POLICY "Motoristas: Próprio motorista pode ler" ON motoristas
    FOR SELECT TO authenticated
    USING (usuario_auth_id = auth.uid());

-- Veículos
CREATE POLICY "Veículos: Leitura para todos" ON veiculos
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Veículos: Admin e Gestor gerenciam" ON veiculos
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- ============================================
-- POLÍTICAS: Pedidos
-- ============================================

-- Todos podem ler pedidos
CREATE POLICY "Pedidos: Leitura para todos autenticados" ON pedidos
    FOR SELECT TO authenticated
    USING (true);

-- Admin e gestor podem modificar
CREATE POLICY "Pedidos: Admin e Gestor modificam" ON pedidos
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- Itens de pedido
CREATE POLICY "Itens Pedido: Leitura para todos" ON itens_pedido
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Itens Pedido: Admin e Gestor modificam" ON itens_pedido
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- ============================================
-- POLÍTICAS: Rotas
-- ============================================

CREATE POLICY "Rotas: Leitura para todos" ON rotas
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Rotas: Admin e Gestor gerenciam" ON rotas
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

CREATE POLICY "Rotas Pedidos: Leitura para todos" ON rotas_pedidos
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Rotas Pedidos: Admin e Gestor gerenciam" ON rotas_pedidos
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- ============================================
-- POLÍTICAS: Usuários
-- ============================================

CREATE POLICY "Usuários: Leitura para todos autenticados" ON usuarios
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Usuários: Apenas Admin gerencia" ON usuarios
    FOR ALL TO authenticated
    USING (eh_admin());

-- Usuário pode atualizar seus próprios dados
CREATE POLICY "Usuários: Próprio usuário atualiza" ON usuarios
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- ============================================
-- POLÍTICAS: Separações
-- ============================================

CREATE POLICY "Separações: Leitura para todos" ON separacoes
    FOR SELECT TO authenticated
    USING (true);

-- Separadores podem inserir suas próprias separações
CREATE POLICY "Separações: Separador insere" ON separacoes
    FOR INSERT TO authenticated
    WITH CHECK (
        perfil_usuario() IN ('separador', 'conferente', 'gestor', 'admin')
        AND separador_id = usuario_id()
    );

-- Separador pode atualizar suas próprias separações
CREATE POLICY "Separações: Separador atualiza próprias" ON separacoes
    FOR UPDATE TO authenticated
    USING (separador_id = usuario_id() OR eh_admin() OR perfil_usuario() = 'gestor');

-- Itens de separação
CREATE POLICY "Itens Separação: Leitura para todos" ON itens_separacao
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Itens Separação: Separador/Conferente gerencia" ON itens_separacao
    FOR ALL TO authenticated
    USING (
        perfil_usuario() IN ('separador', 'conferente', 'gestor', 'admin')
    );

-- ============================================
-- POLÍTICAS: Conferências
-- ============================================

CREATE POLICY "Conferências: Leitura para todos" ON conferencias
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Conferências: Conferente insere" ON conferencias
    FOR INSERT TO authenticated
    WITH CHECK (
        perfil_usuario() IN ('conferente', 'gestor', 'admin')
        AND conferente_id = usuario_id()
    );

CREATE POLICY "Conferências: Conferente atualiza próprias" ON conferencias
    FOR UPDATE TO authenticated
    USING (conferente_id = usuario_id() OR eh_admin() OR perfil_usuario() = 'gestor');

-- ============================================
-- POLÍTICAS: Expedições
-- ============================================

CREATE POLICY "Expedições: Leitura para todos" ON expedicoes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Expedições: Gestor e Admin gerenciam" ON expedicoes
    FOR ALL TO authenticated
    USING (eh_admin() OR perfil_usuario() = 'gestor');

-- ============================================
-- POLÍTICAS: Entregas
-- ============================================

CREATE POLICY "Entregas: Leitura para todos" ON entregas
    FOR SELECT TO authenticated
    USING (true);

-- Motorista pode inserir suas próprias entregas
CREATE POLICY "Entregas: Motorista insere" ON entregas
    FOR INSERT TO authenticated
    WITH CHECK (
        perfil_usuario() IN ('motorista', 'gestor', 'admin')
    );

CREATE POLICY "Entregas: Motorista atualiza próprias" ON entregas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM motoristas m
            WHERE m.id = entregas.motorista_id
            AND m.usuario_auth_id = auth.uid()
        )
        OR eh_admin() 
        OR perfil_usuario() = 'gestor'
    );

-- ============================================
-- POLÍTICAS: Histórico de Status
-- ============================================

CREATE POLICY "Histórico: Leitura para todos" ON historico_status_pedidos
    FOR SELECT TO authenticated
    USING (true);

-- Inserção automática via trigger, mas permitir para todos
CREATE POLICY "Histórico: Inserção automática" ON historico_status_pedidos
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================
-- FIM DAS POLÍTICAS RLS
-- ============================================
