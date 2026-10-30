'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ProductManager = dynamic(() => import('@/components/admin/ProductManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando painel de produtos...</div>,
});
const RifaManager = dynamic(() => import('@/components/admin/RifaManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando painel de rifas...</div>,
});
const CouponManager = dynamic(() => import('@/components/admin/CouponManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando cupons...</div>,
});
const CampaignManager = dynamic(() => import('@/components/admin/CampaignManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando campanhas...</div>,
});
const CategoryManager = dynamic(() => import('@/components/admin/CategoryManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando categorias...</div>,
});
const ConfigManager = dynamic(() => import('@/components/admin/ConfigManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando configurações...</div>,
});
const B2BMediaManager = dynamic(() => import('@/components/admin/B2BMediaManager'), {
    loading: () => <div className="text-center py-8 text-neutral-400">Carregando mídia B2B...</div>,
});

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('produtos');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const checkAdminAuth = async () => {
            try {
                const response = await fetch('/api/admin/auth', { credentials: 'include' });
                const data = await response.json();
                setIsAuthenticated(data.authenticated);
            } catch (error) {
                console.error('Admin auth check failed:', error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdminAuth();
    }, []);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password: passwordInput }),
            });

            const result = await response.json();

            if (result.success) {
                setIsAuthenticated(true);
                setError('');
                setPasswordInput('');
            } else {
                setError(result.message || 'Erro ao entrar');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Erro interno do servidor');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error('Logout error:', error);
        }

        setIsAuthenticated(false);
        setPasswordInput('');
    };

    if (loading) return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando...</div>;

    if (!isAuthenticated) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0', color: 'white' }}>
                <h1 className="titulo-secao">Acesso Administrativo</h1>
                <form onSubmit={handleLogin} style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Senha"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#333'
                            }}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%' }}>Entrar</button>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </form>
            </div>
        );
    }

    return (
        <div className="container admin-painel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="titulo-secao" style={{ margin: 0 }}>Painel Administrativo</h1>
                <button onClick={handleLogout} className="btn btn-secundario" style={{ padding: '5px 15px' }}>
                    Sair
                </button>
            </div>

            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10 }}>
                <button
                    className={`btn ${activeTab === 'produtos' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('produtos')}
                >
                    Produtos
                </button>
                <button
                    className={`btn ${activeTab === 'rifas' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('rifas')}
                >
                    Rifas
                </button>
                <button
                    className={`btn ${activeTab === 'cupons' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('cupons')}
                >
                    Cupons
                </button>
                <button
                    className={`btn ${activeTab === 'campanhas' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('campanhas')}
                >
                    Campanhas
                </button>
                <button
                    className={`btn ${activeTab === 'categorias' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('categorias')}
                >
                    Categorias
                </button>
                <button
                    className={`btn ${activeTab === 'config' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('config')}
                >
                    Configurações
                </button>
                <button
                    className={`btn ${activeTab === 'b2b-media' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('b2b-media')}
                >
                    Mídia B2B
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'produtos' && <ProductManager />}
                {activeTab === 'rifas' && <RifaManager />}
                {activeTab === 'cupons' && <CouponManager />}
                {activeTab === 'campanhas' && <CampaignManager />}
                {activeTab === 'categorias' && <CategoryManager />}
                {activeTab === 'config' && <ConfigManager />}
                {activeTab === 'b2b-media' && <B2BMediaManager />}
            </div>
        </div>
    );
}
