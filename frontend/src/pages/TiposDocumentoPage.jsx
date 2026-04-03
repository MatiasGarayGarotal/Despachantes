import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Pencil, Trash2, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType } from '../api/documentTypes';

const APPLIES_TO_OPTIONS = [
    { value: 'AMBAS',       label: 'Importación y Exportación' },
    { value: 'IMPORTACION', label: 'Solo Importación' },
    { value: 'EXPORTACION', label: 'Solo Exportación' },
];

const VIA_OPTIONS = [
    { value: 'TODAS',     label: 'Todas las vías' },
    { value: 'MARITIMA',  label: 'Solo Marítima' },
    { value: 'TERRESTRE', label: 'Solo Terrestre' },
    { value: 'AEREA',     label: 'Solo Aérea' },
];

const EMPTY_FORM = {
    code: '', name: '', description: '',
    appliesTo: 'AMBAS', viaTransporte: 'TODAS', isAlwaysRequired: false,
    hasExpiration: false, expiryHint: '',
};

// ─── Modal de creación / edición ──────────────────────────────────────────────
const DocTypeModal = ({ initial, onSave, onClose }) => {
    const isEdit = !!initial;
    const [form, setForm] = useState(initial ? {
        code: initial.code,
        name: initial.name,
        description: initial.description || '',
        appliesTo: initial.appliesTo,
        viaTransporte: initial.viaTransporte,
        isAlwaysRequired: initial.isAlwaysRequired,
        hasExpiration: initial.hasExpiration ?? false,
        expiryHint: initial.expiryHint || '',
    } : { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.code.trim() || !form.name.trim()) {
            setError('El código y el nombre son obligatorios.');
            return;
        }
        setSaving(true); setError(null);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const LabeledInput = ({ label, children }) => (
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">{label}</label>
            {children}
        </div>
    );

    const inputCls = "w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all";
    const selectCls = `${inputCls} appearance-none pr-9`;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-brand-navy/50 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-brand-navy text-base">
                        {isEdit ? 'Editar tipo de documento' : 'Nuevo tipo de documento'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-brand-slate-50 rounded-lg">
                        <X size={18} className="text-brand-navy/40" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <LabeledInput label="CÓDIGO">
                            <input
                                className={inputCls}
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                                placeholder="FACTURA_COMERCIAL"
                                disabled={isEdit}
                            />
                        </LabeledInput>
                        <LabeledInput label="NOMBRE">
                            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Factura Comercial" />
                        </LabeledInput>
                    </div>

                    <LabeledInput label="DESCRIPCIÓN (opcional)">
                        <textarea
                            className={`${inputCls} resize-none`}
                            rows={2}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Descripción del tipo de documento..."
                        />
                    </LabeledInput>

                    <div className="grid grid-cols-2 gap-3">
                        <LabeledInput label="APLICA A">
                            <div className="relative">
                                <select className={selectCls} value={form.appliesTo} onChange={e => set('appliesTo', e.target.value)}>
                                    {APPLIES_TO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 pointer-events-none">
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                            </div>
                        </LabeledInput>
                        <LabeledInput label="VÍA DE TRANSPORTE">
                            <div className="relative">
                                <select className={selectCls} value={form.viaTransporte} onChange={e => set('viaTransporte', e.target.value)}>
                                    {VIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 pointer-events-none">
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                            </div>
                        </LabeledInput>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-brand-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-brand-navy/5 transition-all">
                            <div
                                onClick={() => set('isAlwaysRequired', !form.isAlwaysRequired)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                                    form.isAlwaysRequired ? 'bg-brand-navy border-brand-navy' : 'border-brand-navy/20'
                                }`}
                            >
                                {form.isAlwaysRequired && <Check size={12} className="text-brand-gold" strokeWidth={3} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-navy">Siempre requerido</p>
                                <p className="text-[11px] text-brand-navy/40">Obligatorio para todas las carpetas que coincidan con vía y operación</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-brand-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-brand-navy/5 transition-all">
                            <div
                                onClick={() => set('hasExpiration', !form.hasExpiration)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                                    form.hasExpiration ? 'bg-amber-500 border-amber-500' : 'border-brand-navy/20'
                                }`}
                            >
                                {form.hasExpiration && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-navy">Tiene fecha de vencimiento</p>
                                <p className="text-[11px] text-brand-navy/40">Al subir este documento se requerirá ingresar la fecha de vencimiento</p>
                            </div>
                        </label>

                        {form.hasExpiration && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <LabeledInput label="REFERENCIA DE VENCIMIENTO (opcional)">
                                    <input
                                        className={inputCls}
                                        value={form.expiryHint}
                                        onChange={e => set('expiryHint', e.target.value)}
                                        placeholder="Ej: 180 días desde emisión"
                                    />
                                </LabeledInput>
                            </motion.div>
                        )}
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-50 transition-all">
                            {saving ? <Loader2 size={15} className="animate-spin text-brand-gold" /> : null}
                            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tipo'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ─── ConfirmDelete ────────────────────────────────────────────────────────────
const ConfirmDelete = ({ name, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        onClick={onCancel}
    >
        <div className="absolute inset-0 bg-brand-navy/50 backdrop-blur-sm" />
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
            onClick={e => e.stopPropagation()}
        >
            <h3 className="font-display font-bold text-brand-navy text-base mb-2">¿Eliminar tipo de documento?</h3>
            <p className="text-sm text-brand-navy/60 mb-5">
                Se eliminará <span className="font-bold text-brand-navy">"{name}"</span>. Esta acción no se puede deshacer.
            </p>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={onCancel}
                    className="py-3 rounded-xl font-bold text-sm text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                    Cancelar
                </button>
                <button onClick={onConfirm}
                    className="py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-all">
                    Sí, eliminar
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ─── TiposDocumentoPage ───────────────────────────────────────────────────────
const TiposDocumentoPage = () => {
    const [types, setTypes]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [modalData, setModalData] = useState(null); // null = cerrado, {} = create, {...} = edit
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try { setTypes(await getDocumentTypes()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (form) => {
        if (modalData?.id) {
            const updated = await updateDocumentType(modalData.id, form);
            setTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
        } else {
            const created = await createDocumentType(form);
            setTypes(prev => [created, ...prev]);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteDocumentType(deleteTarget.id);
        setTypes(prev => prev.filter(t => t.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const appliesToLabel = (v) => APPLIES_TO_OPTIONS.find(o => o.value === v)?.label ?? v;
    const viaLabel       = (v) => VIA_OPTIONS.find(o => o.value === v)?.label ?? v;

    return (
        <div className="p-4 md:p-10 font-sans bg-brand-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-display font-semibold text-brand-navy tracking-tight">
                        Tipos de Documento
                    </h2>
                    <p className="text-brand-slate-500 text-sm mt-1">
                        {loading ? 'Cargando...' : `${types.length} tipo${types.length !== 1 ? 's' : ''} registrado${types.length !== 1 ? 's' : ''}`}
                    </p>
                </motion.div>

                <button
                    onClick={() => setModalData({})}
                    className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3.5 px-6 rounded-brand shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                    <Plus size={18} className="text-brand-gold" />
                    Nuevo tipo
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-slate-50/60 border-b border-brand-navy/5">
                            {['Código', 'Nombre', 'Aplica a', 'Vía', 'Requerido', 'Vence', ''].map(col => (
                                <th key={col} className="px-6 py-4 text-[10px] font-bold tracking-widest text-brand-navy/40">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-navy/[0.04]">
                        {loading ? (
                            [1,2,3,4].map(i => (
                                <tr key={i} className="animate-pulse">
                                    {[1,2,3,4,5,6,7].map(j => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-3.5 bg-brand-navy/5 rounded w-24" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : types.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-brand-navy/20">
                                        <BookOpen size={36} />
                                        <p className="text-sm font-medium">No hay tipos de documento registrados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            types.map((t, idx) => (
                                <motion.tr
                                    key={t.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-brand-gold/[0.03] transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold text-brand-navy/60 bg-brand-slate-50 px-2 py-1 rounded-lg">
                                            {t.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-sm text-brand-navy">{t.name}</span>
                                        {t.description && (
                                            <p className="text-[11px] text-brand-navy/40 mt-0.5">{t.description}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-brand-navy/50">{appliesToLabel(t.appliesTo)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-brand-navy/50">{viaLabel(t.viaTransporte)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.isAlwaysRequired ? (
                                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">Sí</span>
                                        ) : (
                                            <span className="text-[10px] text-brand-navy/30">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.hasExpiration ? (
                                            <div>
                                                <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full">Sí</span>
                                                {t.expiryHint && (
                                                    <p className="text-[10px] text-brand-navy/40 mt-1">{t.expiryHint}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-brand-navy/30">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <button
                                                onClick={() => setModalData(t)}
                                                className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={14} className="text-brand-navy/50" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(t)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} className="text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modales */}
            <AnimatePresence>
                {modalData !== null && (
                    <DocTypeModal
                        initial={modalData?.id ? modalData : null}
                        onSave={handleSave}
                        onClose={() => setModalData(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmDelete
                        name={deleteTarget.name}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteTarget(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TiposDocumentoPage;
