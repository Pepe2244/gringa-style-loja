'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px' }}>
      <AlertTriangle size={80} color="var(--cor-destaque)" style={{ marginBottom: '20px' }} />
      <h1 className="titulo-secao" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Ops! Algo deu errado.</h1>
      <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '30px', maxWidth: '600px' }}>
        Nossos servidores estão testando uma nova peça ou ocorreu uma falha de conexão com a base de dados. Não se preocupe, a central já foi avisada.
      </p>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          className="btn"
          style={{ cursor: 'pointer', padding: '12px 25px', fontSize: '1.1rem' }}
        >
          Tentar Novamente
        </button>
        <a 
          href="https://wa.me/5515998608170?text=Olá, o site da Gringa Style apresentou um erro técnico." 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secundario"
          style={{ padding: '12px 25px', fontSize: '1.1rem', textDecoration: 'none' }}
        >
          Avisar no WhatsApp
        </a>
      </div>
    </div>
  );
}
