import Link from 'next/link';

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px',
            }}
        >
            <div
                style={{
                    fontFamily: 'var(--fonte-titulos)',
                    fontSize: 'clamp(80px, 20vw, 160px)',
                    fontWeight: '900',
                    color: 'var(--cor-destaque)',
                    lineHeight: 1,
                    marginBottom: '10px',
                }}
            >
                404
            </div>

            <h1
                style={{
                    fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '12px',
                }}
            >
                Página não encontrada
            </h1>

            <p
                style={{
                    color: '#aaa',
                    fontSize: '1.05rem',
                    maxWidth: '420px',
                    lineHeight: '1.6',
                    marginBottom: '36px',
                }}
            >
                O link que você acessou não existe ou foi removido. Mas nossos produtos continuam no lugar certo.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/"
                    className="btn btn-adicionar"
                    style={{
                        padding: '14px 32px',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                    }}
                >
                    Ver Produtos
                </Link>
                <Link
                    href="/rifa"
                    style={{
                        padding: '14px 32px',
                        fontSize: '1rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '700',
                        border: '1px solid #555',
                        color: '#ccc',
                        background: 'transparent',
                    }}
                >
                    Ver Rifa
                </Link>
            </div>
        </div>
    );
}
