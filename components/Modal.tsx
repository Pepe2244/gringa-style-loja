import { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export default function Modal({ isOpen, onClose, children, className = '', title }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-aberto');
        } else {
            document.body.classList.remove('modal-aberto');
        }
        return () => {
            document.body.classList.remove('modal-aberto');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`modal-container visivel`} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className={`modal ${className}`}>
                <button className="modal-fechar" onClick={onClose}>&times;</button>
                <div style={{ width: '100%' }}>
                    {title && <h2 className="modal-titulo" style={{ marginTop: 0 }}>{title}</h2>}
                    {children}
                </div>
            </div>
        </div>
    );
}
