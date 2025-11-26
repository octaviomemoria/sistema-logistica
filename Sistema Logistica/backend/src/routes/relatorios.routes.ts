import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import supabase from '../config/supabase';

const router = Router();

/**
 * @route   GET /api/relatorios/expedicoes
 * @desc    Relatório de expedições por período
 * @access  Privado (Gestor/Admin)
 */
router.get(
    '/expedicoes',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data_inicio, data_fim } = req.query;

            let query = supabase
                .from('expedicoes')
                .select(`
          *,
          pedidos(numero_pedido, numero_nf, valor_total, clientes(nome)),
          rotas(nome, tipo, veiculos(placa), transportadoras(nome)),
          usuarios(nome)
        `);

            if (data_inicio) {
                query = query.gte('data_hora_expedicao', data_inicio);
            }
            if (data_fim) {
                query = query.lte('data_hora_expedicao', data_fim);
            }

            query = query.order('data_hora_expedicao', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            res.json({ expedicoes: data || [] });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/relatorios/entregas
 * @desc    Relatório de entregas por período
 * @access  Privado (Gestor/Admin)
 */
router.get(
    '/entregas',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data_inicio, data_fim } = req.query;

            let query = supabase
                .from('entregas')
                .select(`
          *,
          pedidos(numero_pedido, numero_nf, valor_total, clientes(nome, cidade)),
          motoristas(nome)
        `);

            if (data_inicio) {
                query = query.gte('data_hora_entrega', data_inicio);
            }
            if (data_fim) {
                query = query.lte('data_hora_entrega', data_fim);
            }

            query = query.order('data_hora_entrega', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            res.json({ entregas: data || [] });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/relatorios/desempenho-separadores
 * @desc    Relatório de desempenho dos separadores
 * @access  Privado (Gestor/Admin)
 */
router.get(
    '/desempenho-separadores',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data_inicio, data_fim } = req.query;

            let query = supabase
                .from('separacoes')
                .select(`
          id,
          separador_id,
          data_inicio,
          data_fim,
          status,
          usuarios(nome)
        `)
                .eq('status', 'concluida');

            if (data_inicio) {
                query = query.gte('data_inicio', data_inicio);
            }
            if (data_fim) {
                query = query.lte('data_fim', data_fim);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Agrupar por separador e calcular estatísticas
            const desempenhoPorSeparador = (data || []).reduce((acc: any, sep: any) => {
                const separadorId = sep.separador_id;

                if (!acc[separadorId]) {
                    acc[separadorId] = {
                        separador_id: separadorId,
                        nome_separador: sep.usuarios?.nome,
                        total_separacoes: 0,
                        tempo_total_minutos: 0,
                        tempo_medio_minutos: 0
                    };
                }

                acc[separadorId].total_separacoes++;

                if (sep.data_inicio && sep.data_fim) {
                    const tempoMinutos = (new Date(sep.data_fim).getTime() - new Date(sep.data_inicio).getTime()) / 60000;
                    acc[separadorId].tempo_total_minutos += tempoMinutos;
                }

                return acc;
            }, {});

            // Calcular tempo médio
            Object.values(desempenhoPorSeparador).forEach((desemp: any) => {
                desemp.tempo_medio_minutos = desemp.tempo_total_minutos / desemp.total_separacoes;
            });

            res.json({
                desempenho: Object.values(desempenhoPorSeparador)
            });
        } catch (erro) {
            next(erro);
        }
    }
);

/**
 * @route   GET /api/relatorios/tempo-medio
 * @desc    Relatório de tempo médio de expedição e entrega
 * @access  Privado (Gestor/Admin)
 */
router.get(
    '/tempo-medio',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data_inicio, data_fim } = req.query;

            // Buscar pedidos com datas relevantes
            let query = supabase
                .from('pedidos')
                .select(`
          id,
          numero_pedido,
          data_faturamento,
          expedicoes(data_hora_expedicao),
          entregas(data_hora_entrega)
        `)
                .not('data_faturamento', 'is', null);

            if (data_inicio) {
                query = query.gte('data_faturamento', data_inicio);
            }
            if (data_fim) {
                query = query.lte('data_faturamento', data_fim);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Calcular tempos médios
            let totalTempoExpedicao = 0;
            let countExpedicao = 0;
            let totalTempoEntrega = 0;
            let countEntrega = 0;

            (data || []).forEach((pedido: any) => {
                if (pedido.data_faturamento && pedido.expedicoes?.[0]?.data_hora_expedicao) {
                    const tempo = (new Date(pedido.expedicoes[0].data_hora_expedicao).getTime() -
                        new Date(pedido.data_faturamento).getTime()) / 3600000; // em horas
                    totalTempoExpedicao += tempo;
                    countExpedicao++;
                }

                if (pedido.expedicoes?.[0]?.data_hora_expedicao && pedido.entregas?.[0]?.data_hora_entrega) {
                    const tempo = (new Date(pedido.entregas[0].data_hora_entrega).getTime() -
                        new Date(pedido.expedicoes[0].data_hora_expedicao).getTime()) / 3600000; // em horas
                    totalTempoEntrega += tempo;
                    countEntrega++;
                }
            });

            res.json({
                tempo_medio_expedicao_horas: countExpedicao > 0 ? (totalTempoExpedicao / countExpedicao).toFixed(2) : 0,
                tempo_medio_entrega_horas: countEntrega > 0 ? (totalTempoEntrega / countEntrega).toFixed(2) : 0,
                total_pedidos_analisados: data?.length || 0
            });
        } catch (erro) {
            next(erro);
        }
    }
);

export default router;
