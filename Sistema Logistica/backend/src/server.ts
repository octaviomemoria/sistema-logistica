import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

// Importar rotas
import pedidosRoutes from './routes/pedidos.routes';
import rotasRoutes from './routes/rotas.routes';
import separacaoRoutes from './routes/separacao.routes';
import entregasRoutes from './routes/entregas.routes';
import dashboardRoutes from './routes/dashboard.routes';
import relatoriosRoutes from './routes/relatorios.routes';
import integracaoRoutes from './routes/integracao.routes';
import cadastrosRoutes from './routes/cadastros.routes';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================

// Segurança
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim())
        }
    }));
}

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/rotas', rotasRoutes);
app.use('/api/separacao', separacaoRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/integracao', integracaoRoutes);
app.use('/api/cadastros', cadastrosRoutes);

// Rota 404
app.use((req: Request, res: Response) => {
    res.status(404).json({
        erro: 'Rota não encontrada',
        caminho: req.path
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 API disponível em: http://localhost:${PORT}`);
});

// Handlers de processo
process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;
