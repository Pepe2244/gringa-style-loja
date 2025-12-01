'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
                    <h1>Ops, algo deu errado.</h1>
                    <p>Por favor, recarregue a página.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}
                    >
                        Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
