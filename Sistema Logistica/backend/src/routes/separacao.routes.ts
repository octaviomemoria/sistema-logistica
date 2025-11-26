import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import supabase from '../config/supabase';
import { BadRequestError, NotFoundError } from '../middlewares/errorHandler';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * @route   GET /api/separacao/disponiveis
 * @desc    Listar pedidos disponíveis para separação
 * @access  Privado (Separador)
 */
router.get('/disponiveis', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
        *,
        clientes(nome, cidade),
        itens_pedido(*)
      `)
            .in('status', ['faturado', 'aguardando_separacao'])
            .order('data_faturamento', { ascending: true });

        if (error) throw error;

        res.json({ pedidos: data || [] });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   POST /api/separacao/iniciar
 * @desc    Iniciar separação de um pedido
 * @access  Privado (Separador)
 */
router.post(
    '/iniciar',
    autenticar,
    autorizar('separador', 'conferente', 'gestor', 'admin'),
    [
        body('pedido_id').isUUID().notEmpty()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Dados inválidos');
            }

            const { pedido_id } = req.body;
            const separador_id = req.usuario!.id;

            // Verificar se pedido já está sendo separado
            const { data: separacaoExistente } = await supabase
                .from('separacoes')
                .select('*')
                .eq('pedido_id', pedido_id)
                .eq('status', 'em_andamento')
                .single();

            if (separacaoExistente) {
                throw new BadRequestError('Este pedido já está sendo separado por outro usuário');
            }

            // Criar registro de separação
            const { data: separacao, error } = await supabase
                .from('separacoes')
                .insert({
                    pedido_id,
                    separador_id,
                    status: 'em_andamento',
                    data_inicio: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Atualizar status do pedido
            await supabase
                .from('pedidos')
                .update({ status: 'em_separacao' })
                .eq('id', pedido_id);

            res.json({
                mensagem: 'Separação iniciada com sucesso',
                separacao
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   POST /api/separacao/:separacao_id/item
 * @desc    Confirmar separação de um item
 * @access  Privado (Separador)
 */
router.post(
    '/:separacao_id/item',
    autenticar,
    [
        body('item_pedido_id').isUUID().notEmpty(),
        body('quantidade_separada').isNumeric(),
        body('codigo_barras_conferido').optional().isString()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Dados inválidos');
            }

            const { separacao_id } = req.params;
            const { item_pedido_id, quantidade_separada, codigo_barras_conferido } = req.body;

            const { data, error } = await supabase
                .from('itens_separacao')
                .insert({
                    separacao_id,
                    item_pedido_id,
                    quantidade_separada,
                    codigo_barras_conferido,
                    data_hora_scan: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            res.json({
                mensagem: 'Item separado com sucesso',
                item: data
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   POST /api/separacao/:separacao_id/finalizar
 * @desc    Finalizar separação de um pedido
 * @access  Privado (Separador)
 */
router.post(
    '/:separacao_id/finalizar',
    autenticar,
    async (req: Request, res: Response, next) => {
        try {
            const { separacao_id } = req.params;

            // Atualizar separação
            const { data: separacao, error: erroSeparacao } = await supabase
                .from('separacoes')
                .update({
                    status: 'concluida',
                    data_fim: new Date().toISOString()
                })
                .eq('id', separacao_id)
                .select()
                .single();

            if (erroSeparacao) throw erroSeparacao;

            // Atualizar status do pedido
            await supabase
                .from('pedidos')
                .update({ status: 'separado' })
                .eq('id', separacao.pedido_id);

            res.json({
                mensagem: 'Separação finalizada com sucesso',
                separacao
            });
        } catch (erro) {
            next(erro);
        }
    }
);

export default router;
