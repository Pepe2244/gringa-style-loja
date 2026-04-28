import { NextRequest } from 'next/server';

// Tipos de log
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

// Interface para entrada de log
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    category: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, any>;
}

// Configuração do logger
interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableDatabase: boolean;
    enableExternal: boolean;
    externalEndpoint?: string;
    maxBatchSize: number;
    flushInterval: number;
}

class Logger {
    private config: LoggerConfig;
    private buffer: LogEntry[] = [];
    private flushTimer: NodeJS.Timeout | null = null;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableDatabase: true,
            enableExternal: false,
            maxBatchSize: 10,
            flushInterval: 30000, // 30 segundos
            ...config
        };

        this.startFlushTimer();
    }

    // Métodos de logging
    debug(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>) {
        this.log(LogLevel.DEBUG, message, 'debug', metadata, context);
    }

    info(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>) {
        this.log(LogLevel.INFO, message, 'info', metadata, context);
    }

    warn(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>) {
        this.log(LogLevel.WARN, message, 'warn', metadata, context);
    }

    error(message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>) {
        const errorData = error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : undefined;

        this.log(LogLevel.ERROR, message, 'error', { ...metadata, error: errorData }, context);
    }

    fatal(message: string, error?: Error, metadata?: Record<string, any>, context?: Partial<LogEntry>) {
        const errorData = error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : undefined;

        this.log(LogLevel.FATAL, message, 'fatal', { ...metadata, error: errorData }, context);
    }

    // Método principal de logging
    private log(
        level: LogLevel,
        message: string,
        category: string,
        metadata?: Record<string, any>,
        context?: Partial<LogEntry>
    ) {
        if (level < this.config.level) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            category,
            metadata,
            ...context
        };

        // Adicionar ao buffer
        this.buffer.push(entry);

        // Logging imediato para console se habilitado
        if (this.config.enableConsole) {
            this.logToConsole(entry);
        }

        // Verificar se deve fazer flush
        if (this.buffer.length >= this.config.maxBatchSize) {
            this.flush();
        }
    }

    // Logging para console
    private logToConsole(entry: LogEntry) {
        const levelColors = {
            [LogLevel.DEBUG]: '\x1b[36m', // Cyan
            [LogLevel.INFO]: '\x1b[32m',  // Green
            [LogLevel.WARN]: '\x1b[33m',  // Yellow
            [LogLevel.ERROR]: '\x1b[31m', // Red
            [LogLevel.FATAL]: '\x1b[35m'  // Magenta
        };

        const color = levelColors[entry.level] || '\x1b[0m';
        const reset = '\x1b[0m';
        const levelName = LogLevel[entry.level];

        console.log(
            `${color}[${entry.timestamp}] ${levelName}: ${entry.message}${reset}`,
            entry.metadata ? JSON.stringify(entry.metadata, null, 2) : ''
        );
    }

    // Flush do buffer
    private async flush() {
        if (this.buffer.length === 0) return;

        const entries = [...this.buffer];
        this.buffer = [];

        try {
            // Logging para banco de dados
            if (this.config.enableDatabase) {
                await this.logToDatabase(entries);
            }

            // Logging para serviço externo
            if (this.config.enableExternal && this.config.externalEndpoint) {
                await this.logToExternal(entries);
            }
        } catch (error) {
            console.error('Erro ao fazer flush dos logs:', error);
            // Re-adicionar ao buffer em caso de erro
            this.buffer.unshift(...entries);
        }
    }

    // Logging para banco de dados
    private async logToDatabase(entries: LogEntry[]) {
        try {
            const { supabase } = await import('../lib/supabase');

            const logsToInsert = entries.map(entry => ({
                timestamp: entry.timestamp,
                level: entry.level,
                message: entry.message,
                category: entry.category,
                user_id: entry.userId,
                session_id: entry.sessionId,
                request_id: entry.requestId,
                ip: entry.ip,
                user_agent: entry.userAgent,
                url: entry.url,
                method: entry.method,
                status_code: entry.statusCode,
                duration: entry.duration,
                error_name: entry.error?.name,
                error_message: entry.error?.message,
                error_stack: entry.error?.stack,
                metadata: entry.metadata
            }));

            const { error } = await supabase
                .from('logs')
                .insert(logsToInsert);

            if (error) {
                console.error('Erro ao salvar logs no banco:', error);
            }
        } catch (error) {
            console.error('Erro ao conectar com o banco para logs:', error);
        }
    }

    // Logging para serviço externo
    private async logToExternal(entries: LogEntry[]) {
        if (!this.config.externalEndpoint) return;

        try {
            await fetch(this.config.externalEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logs: entries })
            });
        } catch (error) {
            console.error('Erro ao enviar logs para serviço externo:', error);
        }
    }

    // Iniciar timer de flush
    private startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    // Parar timer de flush
    private stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    // Flush manual
    async forceFlush() {
        await this.flush();
    }

    // Cleanup
    destroy() {
        this.stopFlushTimer();
        this.flush();
    }
}

// Instância global do logger
let loggerInstance: Logger | null = null;

export function getLogger(config?: Partial<LoggerConfig>): Logger {
    if (!loggerInstance) {
        loggerInstance = new Logger(config);
    }
    return loggerInstance;
}

// Middleware de logging para Next.js
export function loggingMiddleware(request: NextRequest) {
    const logger = getLogger();
    const startTime = Date.now();

    // Extrair informações da requisição
    const url = request.url;
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Gerar ID único para a requisição
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log da requisição
    logger.info(`Requisição recebida: ${method} ${url}`, {
        requestId,
        ip,
        userAgent,
        url,
        method
    });

    // Retornar função para log do response
    return {
        logResponse: (statusCode: number, error?: Error) => {
            const duration = Date.now() - startTime;

            if (error) {
                logger.error(`Erro na requisição: ${method} ${url}`, error, {
                    requestId,
                    ip,
                    userAgent,
                    url,
                    method,
                    statusCode,
                    duration
                });
            } else if (statusCode >= 400) {
                logger.warn(`Resposta de erro: ${statusCode} para ${method} ${url}`, {
                    requestId,
                    ip,
                    userAgent,
                    url,
                    method,
                    statusCode,
                    duration
                });
            } else {
                logger.info(`Resposta enviada: ${statusCode} para ${method} ${url}`, {
                    requestId,
                    ip,
                    userAgent,
                    url,
                    method,
                    statusCode,
                    duration
                });
            }
        }
    };
}

// Hook para logging em componentes React
export function useLogger() {
    const logger = getLogger();

    return {
        debug: (message: string, metadata?: Record<string, any>) =>
            logger.debug(message, metadata),
        info: (message: string, metadata?: Record<string, any>) =>
            logger.info(message, metadata),
        warn: (message: string, metadata?: Record<string, any>) =>
            logger.warn(message, metadata),
        error: (message: string, error?: Error, metadata?: Record<string, any>) =>
            logger.error(message, error, metadata),
        fatal: (message: string, error?: Error, metadata?: Record<string, any>) =>
            logger.fatal(message, error, metadata)
    };
}

// Utilitários para diferentes tipos de log
export const logUtils = {
    // Log de performance
    performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
        getLogger().info(`Performance: ${operation}`, {
            ...metadata,
            operation,
            duration,
            unit: 'ms'
        });
    },

    // Log de segurança
    security: (event: string, details: Record<string, any>) => {
        getLogger().warn(`Security event: ${event}`, details, { category: 'security' });
    },

    // Log de negócio
    business: (event: string, data: Record<string, any>) => {
        getLogger().info(`Business event: ${event}`, data, { category: 'business' });
    },

    // Log de erro de API
    apiError: (endpoint: string, error: Error, requestData?: any) => {
        getLogger().error(`API Error: ${endpoint}`, error, {
            endpoint,
            requestData
        }, { category: 'api' });
    }
};