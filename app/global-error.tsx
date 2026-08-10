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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '1.25rem' }}>
          <h1 style={{ color: '#FF3333', fontSize: '4rem', margin: '0 0 1.25rem 0' }}>ERRO 500</h1>
          <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '2.5rem', maxWidth: '500px', lineHeight: 1.6 }}>
            Algo inesperado aconteceu em nossos servidores. Nossa equipe técnica já foi notificada e está trabalhando para resolver o problema.
          </p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: '#FF3333', color: '#fff', border: 'none', padding: '15px 35px', fontSize: '1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            style={{ backgroundColor: '#FF3333', color: '#fff', border: 'none', padding: '0.9rem 2.2rem', fontSize: '1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tentar Reconectar
            Tentar Novamente
          </button>
        </div>
      </body>
    </html>
  );
}
