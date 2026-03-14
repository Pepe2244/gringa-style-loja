'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categorias').select('*').order('nome');
        if (error) {
            console.error('Erro ao buscar categorias:', error);
            alert('Erro ao buscar categorias: ' + error.message);
        }
        if (data) setCategories(data);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('categorias').insert([{ nome: newCategoryName }]);
            if (error) throw error;
            setNewCategoryName('');
            fetchCategories();
            alert('Categoria adicionada!');
        } catch (error: any) {
            alert('Erro ao adicionar categoria: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = (id: number) => setConfirmDelete(id);

    const executeDelete = async () => {
        if (!confirmDelete) return;
        try {
            const { error } = await supabase.from('categorias').delete().eq('id', confirmDelete);
            if (error) throw error;
            fetchCategories();
        } catch (error: any) {
            if (error.code === '23503') {
                alert('Não é possível excluir: Existem produtos nesta categoria.');
            } else {
                alert('Erro ao excluir categoria: ' + error.message);
            }
        } finally {
            setConfirmDelete(null);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="titulo-secao" style={{ marginBottom: 0 }}>Gerenciar Categorias</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Nome da Categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #555', background: '#333', color: 'white' }}
                    />
                    <button className="btn-admin btn-adicionar" onClick={handleAddCategory} disabled={loading}>
                        Adicionar
                    </button>
                </div>
            </div>

            <table className="admin-tabela">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td>{cat.nome}</td>
                            <td>
                                <div className="acoes-btn">
                                    <button className="btn-admin-acao btn-excluir" onClick={() => handleDeleteCategory(cat.id)}>
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="admin-mobile-list">
                {categories.map(cat => (
                    <div key={cat.id} className="admin-mobile-card">
                        <div className="admin-mobile-card-header">
                            <h3 style={{ margin: 0, color: 'var(--cor-destaque)', fontSize: '1.2rem' }}>{cat.nome}</h3>
                        </div>
                        <div className="admin-mobile-card-actions">
                            <button className="btn-admin-acao btn-excluir" onClick={() => handleDeleteCategory(cat.id)} style={{ flex: 1 }}>
                                Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {confirmDelete !== null && (
                <ConfirmModal
                    message="Tem certeza que deseja excluir esta categoria? Isso só é possível se não houver produtos vinculados a ela."
                    confirmLabel="Sim, Excluir"
                    onConfirm={executeDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
