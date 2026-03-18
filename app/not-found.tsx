import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '40px 20px' }}>
      <Search size={80} color="#888" style={{ marginBottom: '20px' }} />
      <h1 className="titulo-secao" style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'white' }}>Página não encontrada</h2>
      <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', lineHeight: 1.6 }}>
        Parece que a página, produto ou categoria que você estava procurando foi movida, esgotou ou não existe mais no nosso catálogo.
      </p>
      <Link href="/" className="btn" style={{ textDecoration: 'none', padding: '15px 30px', fontSize: '1.1rem', borderRadius: '8px' }}>
        Voltar para a Loja Segura
      </Link>
    </div>
  );
}
