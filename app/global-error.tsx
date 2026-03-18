'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
          <h1 style={{ color: '#FF3333', fontSize: '4rem', margin: '0 0 20px 0' }}>ERRO 500</h1>
          <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '500px', lineHeight: 1.6 }}>
            Nossos sistemas de segurança desativaram temporariamente o acesso devido a uma falha no servidor principal. Os técnicos já estão cientes.
          </p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: '#FF3333', color: '#fff', border: 'none', padding: '15px 35px', fontSize: '1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tentar Reconectar
          </button>
        </div>
      </body>
    </html>
  );
}
