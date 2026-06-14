import { createContext, useContext, useState, useCallback } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
        <Toast.Provider swipeDirection="right">
            <ToastContext.Provider value={{ showToast }}>
                {children}
                
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast.Root
                            key={toast.id}
                            duration={toast.duration}
                            onOpenChange={(open) => {
                                if (!open) {
                                    removeToast(toast.id);
                                }
                            }}
                            asChild
                        >
                            <motion.li
                                layout
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`toast-item toast-${toast.type} flex items-center gap-3 px-4 py-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl relative overflow-hidden list-none select-none pointer-events-auto`}
                            >
                                <div className="toast-icon flex-shrink-0">
                                    {toast.type === 'success' && <i className="fa-solid fa-circle-check text-emerald-400"></i>}
                                    {toast.type === 'error' && <i className="fa-solid fa-circle-xmark text-rose-500"></i>}
                                    {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>}
                                    {toast.type === 'info' && <i className="fa-solid fa-circle-info text-cyan-400"></i>}
                                </div>
                                <Toast.Description className="toast-message text-xs text-slate-200 font-medium flex-grow truncate pr-4">
                                    {toast.message}
                                </Toast.Description>
                                <Toast.Close asChild>
                                    <button
                                        className="toast-close-btn text-slate-500 hover:text-slate-200 transition-colors ml-auto p-1 rounded hover:bg-white/5 flex-shrink-0"
                                        aria-label="Close notification"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </Toast.Close>
                                <div
                                    className="toast-progress-bar absolute bottom-0 left-0 h-[3px] w-full origin-left"
                                    style={{ animationDuration: `${toast.duration}ms` }}
                                />
                            </motion.li>
                        </Toast.Root>
                    ))}
                </AnimatePresence>
                <Toast.Viewport className="toast-container fixed bottom-4 right-4 flex flex-col gap-2 w-80 max-w-[100vw] m-0 list-none z-[9999] outline-none" id="global-toast-container" />
            </ToastContext.Provider>
        </Toast.Provider>
    );
}

