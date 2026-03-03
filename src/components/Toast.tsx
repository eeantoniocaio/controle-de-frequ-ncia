import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {type === 'success' ? (
                <CheckCircle2 size={20} />
            ) : (
                <AlertCircle size={20} />
            )}
            <span>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    marginLeft: '8px',
                    display: 'flex',
                    color: 'inherit',
                    opacity: 0.6
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
