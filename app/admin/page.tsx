'use client';

import { useState, useEffect } from 'react';
import ProductManager from '../../components/admin/ProductManager';
import RifaManager from '../../components/admin/RifaManager';
import CouponManager from '../../components/admin/CouponManager';
import CampaignManager from '../../components/admin/CampaignManager';
import PushNotificationManager from '../../components/admin/PushNotificationManager';
import CategoryManager from '../../components/admin/CategoryManager';
import ConfigManager from '../../components/admin/ConfigManager';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('produtos');

    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const sessionAuth = sessionStorage.getItem('adminAuth');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        if (passwordInput.toLowerCase() === "gringa123") {
            setIsAuthenticated(true);
            sessionStorage.setItem('adminAuth', 'true');
            setError('');
        } else {
            setError("Senha incorreta!");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0', color: 'white' }}>
                <h1 className="titulo-secao">Acesso Administrativo</h1>
                <div style={{ maxWidth: '300px', margin: '0 auto', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            style={{ width: '100%', padding: '10px', paddingRight: '40px', marginBottom: '10px', borderRadius: '5px', border: 'none' }}
                        />
                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#555',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            {showPassword ? '👁️' : '🔒'}
                        </button>
                    </div>
                    <button onClick={handleLogin} className="btn" style={{ width: '100%' }}>Entrar</button>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="container admin-painel">
            <h1 className="titulo-secao">Painel Administrativo</h1>

            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
