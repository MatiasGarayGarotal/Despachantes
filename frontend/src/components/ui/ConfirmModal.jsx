import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ConfirmModal — reemplaza confirm() nativo del browser.
 *
 * Props:
 *   isOpen      boolean
 *   title       string
 *   description string
 *   confirmLabel string (default "Confirmar")
 *   cancelLabel  string (default "Cancelar")
 *   dangerous    boolean — si true, botón de confirmación es rojo
 *   onConfirm    () => void
 *   onCancel     () => void
 */
const ConfirmModal = ({
    isOpen,
    title = '¿Estás seguro?',
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    dangerous = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                    onClick={onCancel}
                >
                    <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 8 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="relative z-10 bg-white rounded-2xl shadow-2xl border border-brand-navy/5 p-6 max-w-sm w-full"
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className={`p-3 rounded-2xl ${dangerous ? 'bg-red-50' : 'bg-amber-50'}`}>
                                <AlertTriangle
                                    size={24}
                                    className={dangerous ? 'text-red-500' : 'text-amber-500'}
                                />
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-brand-navy">{title}</h3>
                                {description && (
                                    <p className="text-sm text-brand-navy/60 mt-1.5 leading-relaxed">{description}</p>
                                )}
                            </div>

                            <div className="flex gap-3 w-full justify-end">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="bg-white text-brand-navy font-bold py-3 px-5 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all flex items-center gap-2"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className={`font-bold py-3 px-5 rounded-brand text-sm transition-all flex items-center gap-2 ${
                                        dangerous
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-brand-navy text-white hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
