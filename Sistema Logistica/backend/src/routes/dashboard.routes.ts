import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/auth';
import supabase from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/dashboard/estatisticas
 * @desc    Obter estatísticas principais do dashboard
 * @access  Privado
 */
router.get('/estatisticas', autenticar, async (req: Request, res: Response, next) => {
    try {
        // Chamar função que retorna as estatísticas
        const { data, error } = await supabase.rpc('fn_estatisticas_dashboard');

        if (error) throw error;

        res.json(data?.[0] || {});
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   GET /api/dashboard/pedidos-pendentes
 * @desc    Listar pedidos pendentes de expedição
 * @access  Privado
 */
router.get('/pedidos-pendentes', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('vw_pedidos_pendentes_expedicao')
            .select('*')
            .order('dias_desde_faturamento', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json({ pedidos: data || [] });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   GET /api/dashboard/entregas-atrasadas
 * @desc    Listar entregas atrasadas
 * @access  Privado
 */
router.get('/entregas-atrasadas', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('vw_entregas_atrasadas')
            .select('*')
            .order('dias_atraso', { ascending: false });

        if (error) throw error;

        res.json({ entregas: data || [] });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   GET /api/dashboard/expedicoes-hoje
 * @desc    Listar expedições realizadas hoje
 * @access  Privado
 */
router.get('/expedicoes-hoje', autenticar, async (req: Request, res: Response, next) => {
    try {
        const hoje = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('expedicoes')
            .select(`
        *,
        pedidos(numero_pedido, numero_nf, cliente_id),
        rotas(nome, tipo)
      `)
            .gte('data_hora_expedicao', `${hoje}T00:00:00`)
            .lte('data_hora_expedicao', `${hoje}T23:59:59`)
            .order('data_hora_expedicao', { ascending: false });

        if (error) throw error;

        res.json({ expedicoes: data || [] });
    } catch (erro) {
        next(erro);
    }
});

/**
 * @route   GET /api/dashboard/grafico-expedicoes
 * @desc    Dados para gráfico de expedições dos últimos 7 dias
 * @access  Privado
 */
router.get('/grafico-expedicoes', autenticar, async (req: Request, res: Response, next) => {
    try {
        const diasAtras = 7;
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - diasAtras);

        const { data, error } = await supabase
            .from('expedicoes')
            .select('data_hora_expedicao')
            .gte('data_hora_expedicao', dataInicio.toISOString());

        if (error) throw error;

        // Agrupar por dia
        const contagemPorDia: { [key: string]: number } = {};

        data?.forEach(exp => {
            const dia = new Date(exp.data_hora_expedicao).toISOString().split('T')[0];
            contagemPorDia[dia] = (contagemPorDia[dia] || 0) + 1;
        });

        // Criar array com todos os dias (incluindo os com 0 expedições)
        const resultado = [];
        for (let i = diasAtras - 1; i >= 0; i--) {
            const data = new Date();
            data.setDate(data.getDate() - i);
            const diaKey = data.toISOString().split('T')[0];
            resultado.push({
                data: diaKey,
                quantidade: contagemPorDia[diaKey] || 0
            });
        }

        res.json({ dados: resultado });
    } catch (erro) {
        next(erro);
    }
});

export default router;
