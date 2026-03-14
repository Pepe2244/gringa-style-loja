'use client';

interface ConfirmModalProps {
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({ message, confirmLabel = 'Excluir', onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '20px',
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                    padding: '30px', maxWidth: '400px', width: '100%', textAlign: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '12px' }}>Tem certeza?</h3>
                <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '28px' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #555',
                            background: 'transparent', color: '#ccc', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                            background: '#dc3545', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
