import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import supabase from '../config/supabase';
import { BadRequestError } from '../middlewares/errorHandler';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/rotas
 * @desc    Criar nova rota
 * @access  Privado (Gestor/Admin)
 */
router.post(
    '/',
    autenticar,
    autorizar('gestor', 'admin'),
    [
        body('nome').isString().notEmpty(),
        body('data_rota').isDate(),
        body('tipo').isIn(['frota_propria', 'transportadora']),
        body('veiculo_id').optional().isUUID(),
        body('motorista_id').optional().isUUID(),
        body('transportadora_id').optional().isUUID()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Dados inválidos');
            }

            const dadosRota = req.body;

            // Gerar número de romaneio
            const { data: numeroRomaneio } = await supabase.rpc('fn_gerar_numero_romaneio');

            dadosRota.numero_romaneio = numeroRomaneio;
            dadosRota.status = 'planejada';

            const { data, error } = await supabase
                .from('rotas')
                .insert(dadosRota)
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                mensagem: 'Rota criada com sucesso',
                rota: data
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   POST /api/rotas/:id/pedidos
 * @desc    Adicionar pedidos a uma rota
 * @access  Privado (Gestor/Admin)
 */
router.post(
    '/:id/pedidos',
    autenticar,
    autorizar('gestor', 'admin'),
    [
        body('pedidos').isArray(),
        body('pedidos.*.pedido_id').isUUID(),
        body('pedidos.*.sequencia_entrega').isInt()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const { id: rota_id } = req.params;
            const { pedidos } = req.body;

            // Adicionar rota_id a cada pedido
            const dadosParaInserir = pedidos.map((p: any) => ({
                ...p,
                rota_id
            }));

            const { data, error } = await supabase
                .from('rotas_pedidos')
                .insert(dadosParaInserir)
                .select();

            if (error) throw error;

            res.json({
                mensagem: 'Pedidos adicionados à rota com sucesso',
                items: data
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/rotas/:id
 * @desc    Obter detalhes de uma rota
 * @access  Privado
 */
router.get('/:id', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { id } = req.params;

        // Buscar rota
        const { data: rota, error: erroRota } = await supabase
            .from('rotas')
            .select(`
        *,
        veiculos(*),
        motoristas(*),
        transportadoras(*)
      `)
            .eq('id', id)
            .single();

        if (erroRota) throw erroRota;

        // Buscar pedidos da rota
        const { data: pedidos, error: erroPedidos } = await supabase
            .from('rotas_pedidos')
            .select(`
        *,
        pedidos(
          *,
          clientes(nome, logradouro, numero, bairro, cidade, uf, latitude, longitude)
        )
      `)
            .eq('rota_id', id)
            .order('sequencia_entrega');

        if (erroPedidos) throw erroPedidos;

        res.json({
            rota,
            pedidos: pedidos || []
        });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   GET /api/rotas
 * @desc    Listar rotas
 * @access  Privado
 */
router.get('/', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data_inicio, data_fim, status, tipo } = req.query;

        let query = supabase
            .from('rotas')
            .select(`
        *,
        veiculos(placa),
        motoristas(nome),
        transportadoras(nome)
      `);

        if (data_inicio) {
            query = query.gte('data_rota', data_inicio);
        }
        if (data_fim) {
            query = query.lte('data_rota', data_fim);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (tipo) {
            query = query.eq('tipo', tipo);
        }

        query = query.order('data_rota', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        res.json({ rotas: data || [] });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   PATCH /api/rotas/:id/status
 * @desc    Atualizar status da rota
 * @access  Privado (Gestor/Admin)
 */
router.patch(
    '/:id/status',
    autenticar,
    autorizar('gestor', 'admin'),
    [
        body('status').isIn(['planejada', 'em_andamento', 'concluida', 'cancelada'])
    ],
    async (req: Request, res: Response, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const dadosAtualizacao: any = { status };

            // Se iniciando, registrar horário de saída
            if (status === 'em_andamento') {
                dadosAtualizacao.horario_saida_real = new Date().toISOString();
            }

            // Se concluindo, registrar horário de retorno
            if (status === 'concluida') {
                dadosAtualizacao.horario_retorno_real = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('rotas')
                .update(dadosAtualizacao)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                mensagem: 'Status da rota atualizado com sucesso',
                rota: data
            });
        } catch (erro) {
            next(erro);
        }
    }
);

export default router;
