'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import { Trash2, Plus } from 'lucide-react';

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categorias').select('*').order('nome');
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

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Tem certeza?')) return;
        try {
            const { error } = await supabase.from('categorias').delete().eq('id', id);
            if (error) throw error;
            fetchCategories();
            alert('Categoria excluída!');
        } catch (error: any) {
            if (error.code === '23503') {
                alert('Não é possível excluir: Existem produtos nesta categoria.');
            } else {
                alert('Erro ao excluir categoria: ' + error.message);
            }
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
        </div>
    );
}
