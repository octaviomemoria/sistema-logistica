import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/auth';
import supabase from '../config/supabase';
import { BadRequestError, NotFoundError } from '../middlewares/errorHandler';
import { body, query, validationResult } from 'express-validator';

const router = Router();

/**
 * @route   GET /api/pedidos
 * @desc    Listar pedidos com filtros
 * @access  Privado
 */
router.get(
    '/',
    autenticar,
    [
        query('status').optional().isString(),
        query('cliente_id').optional().isUUID(),
        query('data_inicio').optional().isDate(),
        query('data_fim').optional().isDate(),
        query('limite').optional().isInt({ min: 1, max: 100 }),
        query('pagina').optional().isInt({ min: 1 })
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Parâmetros inválidos');
            }

            const {
                status,
                cliente_id,
                data_inicio,
                data_fim,
                limite = 50,
                pagina = 1
            } = req.query;

            let query = supabase
                .from('vw_pedidos_dashboard')
                .select('*', { count: 'exact' });

            // Aplicar filtros
            if (status) {
                query = query.eq('status', status);
            }
            if (cliente_id) {
                query = query.eq('cliente_id', cliente_id);
            }
            if (data_inicio) {
                query = query.gte('data_pedido', data_inicio);
            }
            if (data_fim) {
                query = query.lte('data_pedido', data_fim);
            }

            // Paginação
            const inicio = ((Number(pagina) - 1) * Number(limite));
            query = query
                .range(inicio, inicio + Number(limite) - 1)
                .order('data_pedido', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            res.json({
                pedidos: data,
                paginacao: {
                    total: count,
                    pagina: Number(pagina),
                    limite: Number(limite),
                    totalPaginas: Math.ceil((count || 0) / Number(limite))
                }
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/pedidos/:id
 * @desc    Obter detalhes de um pedido específico
 * @access  Privado
 */
router.get('/:id', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { id } = req.params;

        // Buscar pedido completo
        const { data: pedido, error } = await supabase
            .from('vw_pedidos_dashboard')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !pedido) {
            throw new NotFoundError('Pedido');
        }

        // Buscar itens do pedido
        const { data: itens } = await supabase
            .from('itens_pedido')
            .select('*')
            .eq('pedido_id', id)
            .order('descricao_produto');

        // Buscar histórico de status
        const { data: historico } = await supabase
            .from('historico_status_pedidos')
            .select('*')
            .eq('pedido_id', id)
            .order('created_at', { ascending: false });

        res.json({
            pedido,
            itens: itens || [],
            historico: historico || []
        });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   PATCH /api/pedidos/:id/status
 * @desc    Atualizar status de um pedido
 * @access  Privado (Admin/Gestor)
 */
router.patch(
    '/:id/status',
    autenticar,
    [
        body('status').isString().notEmpty()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Status inválido');
            }

            const { id } = req.params;
            const { status } = req.body;

            const { data, error } = await supabase
                .from('pedidos')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) throw new NotFoundError('Pedido');

            res.json({
                mensagem: 'Status atualizado com sucesso',
                pedido: data
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/pedidos/:id/timeline
 * @desc    Obter timeline/histórico completo de um pedido
 * @access  Privado
 */
router.get('/:id/timeline', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { id } = req.params;

        // Buscar eventos do pedido em ordem cronológica
        const eventos = [];

        // 1. Criação do pedido
        const { data: pedido } = await supabase
            .from('pedidos')
            .select('created_at, data_pedido, data_faturamento')
            .eq('id', id)
            .single();

        if (pedido) {
            eventos.push({
                tipo: 'criacao',
                data: pedido.created_at,
                descricao: 'Pedido criado no sistema'
            });
            if (pedido.data_faturamento) {
                eventos.push({
                    tipo: 'faturamento',
                    data: pedido.data_faturamento,
                    descricao: 'Pedido faturado'
                });
            }
        }

        // 2. Separações
        const { data: separacoes } = await supabase
            .from('separacoes')
            .select('*, usuarios(nome)')
            .eq('pedido_id', id)
            .order('created_at');

        separacoes?.forEach(sep => {
            eventos.push({
                tipo: 'separacao_iniciada',
                data: sep.data_inicio,
                descricao: `Separação iniciada por ${sep.usuarios?.nome}`,
                usuario: sep.usuarios?.nome
            });
            if (sep.data_fim) {
                eventos.push({
                    tipo: 'separacao_concluida',
                    data: sep.data_fim,
                    descricao: `Separação concluída por ${sep.usuarios?.nome}`,
                    usuario: sep.usuarios?.nome
                });
            }
        });

        // 3. Conferências
        const { data: conferencias } = await supabase
            .from('conferencias')
            .select('*, usuarios(nome)')
            .eq('pedido_id', id)
            .order('created_at');

        conferencias?.forEach(conf => {
            eventos.push({
                tipo: 'conferencia',
                data: conf.data_hora,
                descricao: `Conferência ${conf.aprovado ? 'aprovada' : 'reprovada'} por ${conf.usuarios?.nome}`,
                usuario: conf.usuarios?.nome,
                aprovado: conf.aprovado
            });
        });

        // 4. Expedição
        const { data: expedicao } = await supabase
            .from('expedicoes')
            .select('*, usuarios(nome)')
            .eq('pedido_id', id)
            .single();

        if (expedicao) {
            eventos.push({
                tipo: 'expedicao',
                data: expedicao.data_hora_expedicao,
                descricao: `Pedido expedido - Romaneio: ${expedicao.numero_romaneio}`,
                usuario: expedicao.usuarios?.nome
            });
        }

        // 5. Entrega
        const { data: entrega } = await supabase
            .from('entregas')
            .select('*, motoristas(nome)')
            .eq('pedido_id', id)
            .single();

        if (entrega) {
            eventos.push({
                tipo: 'entrega',
                data: entrega.data_hora_entrega,
                descricao: `Entregue para ${entrega.nome_recebedor}`,
                motorista: entrega.motoristas?.nome,
                recebedor: entrega.nome_recebedor
            });
        }

        // Ordenar eventos por data
        eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        res.json({ timeline: eventos });
    } catch (erro) {
        next(erro);
    }
});

export default router;
