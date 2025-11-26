import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/auth';
import supabase from '../config/supabase';

const router = Router();

// ============================================
// CLIENTES
// ============================================
router.get('/clientes', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*, regioes(nome)')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json({ clientes: data || [] });
    } catch (erro) {
        next(erro);
    }
});

// ============================================
// VENDEDORES
// ============================================
router.get('/vendedores', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('vendedores')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json({ vendedores: data || [] });
    } catch (erro) {
        next(erro);
    }
});

// ============================================
// REGIÕES
// ============================================
router.get('/regioes', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('regioes')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json({ regioes: data || [] });
    } catch (erro) {
        next(erro);
    }
});

// ============================================
// TRANSPORTADORAS
// ============================================
router.get('/transportadoras', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json({ transportadoras: data || [] });
    } catch (erro) {
        next(erro);
    }
});

router.post(
    '/transportadoras',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data, error } = await supabase
                .from('transportadoras')
                .insert(req.body)
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ transportadora: data });
        } catch (erro) {
            next(erro);
        }
    }
);

// ============================================
// VEÍCULOS
// ============================================
router.get('/veiculos', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('veiculos')
            .select('*, motoristas(nome)')
            .eq('ativo', true)
            .order('placa');

        if (error) throw error;
        res.json({ veiculos: data || [] });
    } catch (erro) {
        next(erro);
    }
});

router.post(
    '/veiculos',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data, error } = await supabase
                .from('veiculos')
                .insert(req.body)
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ veiculo: data });
        } catch (erro) {
            next(erro);
        }
    }
);

// ============================================
// MOTORISTAS
// ============================================
router.get('/motoristas', autenticar, async (req: Request, res: Response, next) => {
    try {
        const { data, error } = await supabase
            .from('motoristas')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        res.json({ motoristas: data || [] });
    } catch (erro) {
        next(erro);
    }
});

router.post(
    '/motoristas',
    autenticar,
    autorizar('gestor', 'admin'),
    async (req: Request, res: Response, next) => {
        try {
            const { data, error } = await supabase
                .from('motoristas')
                .insert(req.body)
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ motorista: data });
        } catch (erro) {
            next(erro);
        }
    }
);

export default router;
