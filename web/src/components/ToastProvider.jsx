import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" id="global-toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast-item toast-${toast.type}`}
                        role="alert"
                    >
                        <div className="toast-icon">
                            {toast.type === 'success' && <i className="fa-solid fa-circle-check"></i>}
                            {toast.type === 'error' && <i className="fa-solid fa-circle-xmark"></i>}
                            {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation"></i>}
                            {toast.type === 'info' && <i className="fa-solid fa-circle-info"></i>}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            className="toast-close-btn"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Close notification"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <div
                            className="toast-progress-bar"
                            style={{ animationDuration: `${toast.duration}ms` }}
                        ></div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
