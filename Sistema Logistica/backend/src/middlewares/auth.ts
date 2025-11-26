import { Request, Response, NextFunction } from 'express';
import { createUserSupabaseClient } from '../config/supabase';
import { UnauthorizedError } from './errorHandler';

// Extender o tipo Request para incluir o usuário autenticado
declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id: string;
                auth_user_id: string;
                email: string;
                perfil: string;
                nome: string;
            };
        }
    }
}

/**
 * Middleware de autenticação via Supabase
 * Valida o token JWT do Supabase e adiciona informações do usuário ao request
 */
export async function autenticar(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token de autenticação não fornecido');
        }

        const token = authHeader.substring(7); // Remove "Bearer "

        // Criar cliente Supabase com o token do usuário
        const supabase = createUserSupabaseClient(token);

        // Verificar o token e obter o usuário
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new UnauthorizedError('Token inválido ou expirado');
        }

        // Buscar dados do usuário na tabela usuarios
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('id, auth_user_id, email, perfil, nome, ativo')
            .eq('auth_user_id', user.id)
            .single();

        if (userError || !usuario) {
            throw new UnauthorizedError('Usuário não encontrado no sistema');
        }

        if (!usuario.ativo) {
            throw new UnauthorizedError('Usuário inativo');
        }

        // Adicionar usuário ao request
        req.usuario = {
            id: usuario.id,
            auth_user_id: usuario.auth_user_id,
            email: usuario.email,
            perfil: usuario.perfil,
            nome: usuario.nome
        };

        next();
    } catch (erro) {
        next(erro);
    }
}

/**
 * Middleware para verificar permissões por perfil
 * @param perfisPermitidos - Array de perfis que podem acessar a rota
 */
export function autorizar(...perfisPermitidos: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return next(new UnauthorizedError('Autenticação necessária'));
        }

        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return next(new UnauthorizedError('Permissão insuficiente para esta operação'));
        }

        next();
    };
}
