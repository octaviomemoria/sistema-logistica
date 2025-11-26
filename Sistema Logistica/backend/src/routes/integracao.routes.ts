import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/integracao/sap/webhook
 * @desc    Webhook para receber notificações do SAP B1
 * @access  Privado (Admin) ou API Key
 */
router.post(
    '/sap/webhook',
    autenticar,
    autorizar('admin'),
    async (req: Request, res: Response, next) => {
        try {
            const pedidoData = req.body;

            logger.info('Webhook SAP recebido:', pedidoData);

            // Aqui você processaria os dados do pedido vindo do SAP
            // Por exemplo, criar/atualizar pedido no sistema

            res.json({ mensagem: 'Webhook processado com sucesso' });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   POST /api/integracao/wms/webhook
 * @desc    Webhook para receber notificações do WMS Expert
 * @access  Privado (Admin) ou API Key
 */
router.post(
    '/wms/webhook',
    autenticar,
    autorizar('admin'),
    async (req: Request, res: Response, next) => {
        try {
            const separacaoData = req.body;

            logger.info('Webhook WMS recebido:', separacaoData);

            // Aqui você processaria os dados de separação vindos do WMS

            res.json({ mensagem: 'Webhook processado com sucesso' });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/integracao/status
 * @desc    Verificar status das integrações
 * @access  Privado (Admin/Gestor)
 */
router.get(
    '/status',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            // Verificar conectividade com SAP, WMS, etc.
            const status = {
                sap_b1: {
                    conectado: false, // Implementar verificação real
                    ultima_sincronizacao: null
                },
                wms_expert: {
                    conectado: false, // Implementar verificação real
                    ultima_sincronizacao: null
                },
                google_drive: {
                    conectado: true, // Verificar se as credenciais estão configuradas
                    espaco_disponivel: null
                }
            };

            res.json({ status });
        } catch (erro) {
            next(erro);
        }
    }
);

export default router;
