'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductManager from '@/components/admin/ProductManager';
import RifaManager from '@/components/admin/RifaManager';
import CouponManager from '@/components/admin/CouponManager';
import CampaignManager from '@/components/admin/CampaignManager';
import CategoryManager from '@/components/admin/CategoryManager';
import ConfigManager from '@/components/admin/ConfigManager';

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
            </div>

            <div className="admin-content">
                {activeTab === 'produtos' && <ProductManager />}
                {activeTab === 'rifas' && <RifaManager />}
                {activeTab === 'cupons' && <CouponManager />}
                {activeTab === 'campanhas' && <CampaignManager />}
                {activeTab === 'categorias' && <CategoryManager />}
                {activeTab === 'config' && <ConfigManager />}
            </div>
        </div>
    );
}
