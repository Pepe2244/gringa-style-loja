'use client';

import { useState, useEffect } from 'react';
import { loginAction, checkAuth, logoutAction } from '@/app/actions/auth';
import { supabase } from '@/lib/supabase';
import ProductManager from '@/components/admin/ProductManager';
import RifaManager from '@/components/admin/RifaManager';
import CouponManager from '@/components/admin/CouponManager';
import CampaignManager from '@/components/admin/CampaignManager';
import PushNotificationManager from '@/components/admin/PushNotificationManager';
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
        checkAuth().then(isAuth => {
            setIsAuthenticated(isAuth);
            setLoading(false);
        });
    }, []);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const formData = new FormData();
        formData.append('password', passwordInput);

        const result = await loginAction(formData);

        if (result.success) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError(result.message || 'Erro ao entrar');
        }
    };

    const handleLogout = async () => {
        await logoutAction();
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
                    className={`btn ${activeTab === 'push' ? '' : 'btn-secundario'}`}
                    onClick={() => setActiveTab('push')}
                >
                    Notificações
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'produtos' && <ProductManager />}
                {activeTab === 'rifas' && <RifaManager />}
                {activeTab === 'cupons' && <CouponManager />}
                {activeTab === 'campanhas' && <CampaignManager />}
                {activeTab === 'categorias' && <CategoryManager />}
                {activeTab === 'config' && <ConfigManager />}
                {activeTab === 'push' && <PushNotificationManager />}
            </div>
        </div>
    );
}
