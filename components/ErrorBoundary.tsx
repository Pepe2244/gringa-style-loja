'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { trackError } from '@/utils/analytics';

interface Props {
    children?: ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log do erro
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Track no analytics
        trackError(error.message, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
        });

        // Callback customizado se fornecido
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    private resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ error, resetError }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '20px',
        backgroundColor: 'var(--cor-fundo)',
        color: 'var(--cor-texto)',
        textAlign: 'center',
        borderRadius: '8px',
        border: '1px solid #ff4757'
    }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{
            fontFamily: 'var(--fonte-titulos)',
            color: '#ff4757',
            marginBottom: '15px'
        }}>
            Ops! Algo deu errado
        </h2>
        <p style={{
            color: '#888',
            marginBottom: '20px',
            maxWidth: '500px',
            lineHeight: '1.6'
        }}>
            Desculpe pelo inconveniente. Ocorreu um erro inesperado.
            Nossa equipe foi notificada e estamos trabalhando para resolver.
        </p>
        {error && process.env.NODE_ENV === 'development' && (
            <details style={{
                backgroundColor: '#1a1a1a',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                width: '100%',
                maxWidth: '600px',
                textAlign: 'left'
            }}>
                <summary style={{ cursor: 'pointer', color: '#ff4757' }}>
                    Detalhes do erro (desenvolvimento)
                </summary>
                <pre style={{
                    color: '#ccc',
                    fontSize: '0.8rem',
                    marginTop: '10px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                </pre>
            </details>
        )}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
                onClick={resetError}
                style={{
                    backgroundColor: 'var(--cor-destaque)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Tentar Novamente
            </button>
            <Link
                href="/"
                style={{
                    backgroundColor: 'transparent',
                    color: 'var(--cor-destaque)',
                    border: '1px solid var(--cor-destaque)',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                }}
            >
                Voltar ao Início
            </Link>
        </div>
    </div>
);

export default ErrorBoundary;
