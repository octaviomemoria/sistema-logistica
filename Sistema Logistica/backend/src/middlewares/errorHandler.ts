import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ErroAPI extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export function errorHandler(
    erro: ErroAPI,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = erro.statusCode || 500;
    const message = erro.message || 'Erro interno do servidor';

    // Logar o erro
    logger.error('Erro na API:', {
        erro: message,
        stack: erro.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Resposta ao cliente
    res.status(statusCode).json({
        erro: true,
        mensagem: message,
        ...(process.env.NODE_ENV === 'development' && { stack: erro.stack })
    });
}

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Erros específicos
export class NotFoundError extends ApiError {
    constructor(recurso: string) {
        super(`${recurso} não encontrado`, 404);
    }
}

export class UnauthorizedError extends ApiError {
    constructor(mensagem: string = 'Não autorizado') {
        super(mensagem, 401);
    }
}

export class ForbiddenError extends ApiError {
    constructor(mensagem: string = 'Acesso negado') {
        super(mensagem, 403);
    }
}

export class BadRequestError extends ApiError {
    constructor(mensagem: string) {
        super(mensagem, 400);
    }
}
