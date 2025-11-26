import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import supabase from '../config/supabase';
import { uploadParaDrive } from '../config/googleDrive';
import { BadRequestError } from '../middlewares/errorHandler';
import { body, validationResult } from 'express-validator';
import multer from 'multer';

const router = Router();

// Configurar multer para upload em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * @route   GET /api/entregas/minhas-rotas
 * @desc    Obter rotas do motorista logado
 * @access  Privado (Motorista)
 */
router.get('/minhas-rotas', autenticar, async (req: Request, res: Response, next) => {
    try {
        // Buscar ID do motorista baseado no usuário autenticado
        const { data: motorista } = await supabase
            .from('motoristas')
            .select('id')
            .eq('usuario_auth_id', req.usuario!.auth_user_id)
            .single();

        if (!motorista) {
            throw new BadRequestError('Motorista não encontrado');
        }

        const hoje = new Date().toISOString().split('T')[0];

        // Buscar rotas do motorista para hoje
        const { data: rotas, error } = await supabase
            .from('rotas')
            .select(`
        *,
        veiculos(placa, modelo)
      `)
            .eq('motorista_id', motorista.id)
            .gte('data_rota', hoje)
            .lte('data_rota', hoje)
            .order('horario_saida_previsto');

        if (error) throw error;

        // Para cada rota, buscar os pedidos
        const rotasComPedidos = await Promise.all(
            (rotas || []).map(async (rota) => {
                const { data: pedidos } = await supabase
                    .from('rotas_pedidos')
                    .select(`
            *,
            pedidos(
              *,
              clientes(nome, logradouro, numero, bairro, cidade, uf, telefone, latitude, longitude)
            )
          `)
                    .eq('rota_id', rota.id)
                    .order('sequencia_entrega');

                return {
                    ...rota,
                    pedidos: pedidos || []
                };
            })
        );

        res.json({ rotas: rotasComPedidos });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   POST /api/entregas
 * @desc    Registrar entrega com comprovante (POD)
 * @access  Privado (Motorista)
 */
router.post(
    '/',
    autenticar,
    autorizar('motorista', 'gestor', 'admin'),
    upload.fields([
        { name: 'assinatura', maxCount: 1 },
        { name: 'foto_comprovante', maxCount: 1 }
    ]),
    [
        body('pedido_id').isUUID().notEmpty(),
        body('nome_recebedor').isString().notEmpty(),
        body('documento_recebedor').optional().isString(),
        body('latitude').optional().isNumeric(),
        body('longitude').optional().isNumeric(),
        body('ocorrencia').optional().isString()
    ],
    async (req: Request, res: Response, next) => {
        try {
            const erros = validationResult(req);
            if (!erros.isEmpty()) {
                throw new BadRequestError('Dados inválidos');
            }

            const { pedido_id, nome_recebedor, documento_recebedor, latitude, longitude, ocorrencia } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Buscar motorista
            const { data: motorista } = await supabase
                .from('motoristas')
                .select('id')
                .eq('usuario_auth_id', req.usuario!.auth_user_id)
                .single();

            if (!motorista) {
                throw new BadRequestError('Motorista não encontrado');
            }

            let assinaturaUrl = null;
            let fotoUrl = null;

            // Upload da assinatura para Google Drive
            if (files.assinatura && files.assinatura[0]) {
                const assinaturaFile = files.assinatura[0];
                const nomeArquivo = `assinatura_${pedido_id}_${Date.now()}.png`;
                assinaturaUrl = await uploadParaDrive(nomeArquivo, 'image/png', assinaturaFile.buffer);
            }

            // Upload da foto para Google Drive
            if (files.foto_comprovante && files.foto_comprovante[0]) {
                const fotoFile = files.foto_comprovante[0];
                const nomeArquivo = `comprovante_${pedido_id}_${Date.now()}.jpg`;
                fotoUrl = await uploadParaDrive(nomeArquivo, 'image/jpeg', fotoFile.buffer);
            }

            // Registrar entrega
            const { data: entrega, error: erroEntrega } = await supabase
                .from('entregas')
                .insert({
                    pedido_id,
                    motorista_id: motorista.id,
                    nome_recebedor,
                    documento_recebedor,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    assinatura_url: assinaturaUrl,
                    foto_comprovante_url: fotoUrl,
                    ocorrencia,
                    data_hora_entrega: new Date().toISOString()
                })
                .select()
                .single();

            if (erroEntrega) throw erroEntrega;

            // Atualizar status do pedido para entregue
            await supabase
                .from('pedidos')
                .update({ status: 'entregue' })
                .eq('id', pedido_id);

            // Atualizar status do pedido na rota
            await supabase
                .from('rotas_pedidos')
                .update({ status: 'entregue' })
                .eq('pedido_id', pedido_id);

            res.status(201).json({
                mensagem: 'Entrega registrada com sucesso',
                entrega
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/entregas/:pedido_id/comprovante
 * @desc    Obter comprovante de entrega de um pedido
 * @access  Privado
 */
router.get('/:pedido_id/comprovante', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { pedido_id } = req.params;

        const { data, error } = await supabase
            .from('entregas')
            .select(`
        *,
        motoristas(nome, telefone)
      `)
            .eq('pedido_id', pedido_id)
            .single();

        if (error || !data) {
            throw new BadRequestError('Comprovante de entrega não encontrado');
        }

        res.json({ comprovante: data });
    } catch (erro) {
        next(erro);
    }
});

export default router;
