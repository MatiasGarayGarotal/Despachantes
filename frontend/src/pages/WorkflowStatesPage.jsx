import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Pencil, Check, X, Info, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorkflowStates, updateWorkflowState } from '../api/workflowStates';

const OPERATION_TYPES = [
    { id: 'IMPORTACION', label: 'Importación' },
    { id: 'EXPORTACION', label: 'Exportación' },
    { id: 'TRANSITO',    label: 'Tránsito'    },
];

// ── Fila de estado ─────────────────────────────────────────────────────────────
const StateRow = ({ state, onUpdated }) => {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(state.name);
    const [saving, setSaving] = useState(false);

    const handleSaveName = async () => {
        if (!name.trim() || name.trim() === state.name) { setEditing(false); return; }
        setSaving(true);
        try {
            const updated = await updateWorkflowState(state.id, { name: name.trim(), isActive: state.isActive });
            onUpdated(updated);
            setEditing(false);
        } catch (err) {
            console.error('Error guardando estado:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        setSaving(true);
        try {
            const updated = await updateWorkflowState(state.id, { name: state.name, isActive: !state.isActive });
            onUpdated(updated);
        } catch (err) {
            console.error('Error actualizando estado:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveName();
        if (e.key === 'Escape') { setName(state.name); setEditing(false); }
    };

    return (
        <div className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
            state.isActive ? '' : 'opacity-50'
        }`}>
            {/* Step number */}
            <div className="w-7 h-7 rounded-full bg-brand-navy/[0.06] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-brand-navy/50">#{state.stepOrder}</span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-brand-slate-50 border border-brand-gold/40 rounded-lg py-1.5 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all"
                    />
                ) : (
                    <span className="text-sm font-bold text-brand-navy">{state.name}</span>
                )}
            </div>

            {/* Code badge */}
            <span className="hidden sm:inline-flex text-[10px] font-bold text-brand-navy/40 bg-brand-navy/[0.05] px-2.5 py-1 rounded-lg tracking-wide shrink-0">
                {state.code}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
                {editing ? (
                    <>
                        <button
                            onClick={handleSaveName}
                            disabled={saving}
                            title="Guardar"
                            className="p-1.5 rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        </button>
                        <button
                            onClick={() => { setName(state.name); setEditing(false); }}
                            title="Cancelar"
                            className="p-1.5 rounded-lg bg-brand-navy/5 text-brand-navy/50 hover:bg-brand-navy/10 transition-colors"
                        >
                            <X size={13} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        title="Editar nombre"
                        className="p-1.5 rounded-lg text-brand-navy/30 hover:text-brand-navy hover:bg-brand-navy/5 transition-colors"
                    >
                        <Pencil size={13} />
                    </button>
                )}

                {/* Active toggle */}
                <button
                    onClick={handleToggleActive}
                    disabled={saving}
                    title={state.isActive ? 'Desactivar' : 'Activar'}
                    className="shrink-0 disabled:opacity-50"
                >
                    {state.isActive
                        ? <ToggleRight size={26} className="text-emerald-500" />
                        : <ToggleLeft size={26} className="text-brand-navy/25" />
                    }
                </button>
            </div>
        </div>
    );
};

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
const WorkflowStatesPage = () => {
    const [activeTab, setActiveTab] = useState('IMPORTACION');
    const [states, setStates] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStates = useCallback((operationType) => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getWorkflowStates(operationType)
            .then(data => {
                if (!cancelled) setStates(prev => ({ ...prev, [operationType]: data }));
            })
            .catch(err => {
                if (!cancelled) setError('Error cargando estados. Intentá de nuevo.');
                console.error(err);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        fetchStates(activeTab);
    }, [activeTab, fetchStates]);

    const handleUpdated = (updated) => {
        setStates(prev => ({
            ...prev,
            [activeTab]: (prev[activeTab] || []).map(s => s.id === updated.id ? updated : s),
        }));
    };

    const currentStates = states[activeTab] || [];

    return (
        <div className="flex flex-col h-full font-sans overflow-auto">
            <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 shrink-0">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-navy rounded-xl">
                            <GitBranch size={18} className="text-brand-gold" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-semibold text-brand-navy tracking-tight">
                                Estados de Workflow
                            </h2>
                            <p className="text-brand-slate-500 text-sm mt-0.5">
                                Configurá los estados y su orden por tipo de operación
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Banner informativo */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                    <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Los <strong>códigos de estado</strong> (APERTURA, NUMERADO, etc.) son internos y no pueden modificarse.
                        Solo el nombre visible y el estado activo/inactivo son editables.
                    </p>
                </div>

                {/* Tabs de tipo de operación */}
                <div className="flex gap-1 p-1 bg-brand-navy/[0.04] rounded-xl w-fit">
                    {OPERATION_TYPES.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === id
                                    ? 'bg-brand-navy text-white shadow-md'
                                    : 'text-brand-navy/50 hover:text-brand-navy hover:bg-white/60'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 px-4 md:px-8 pb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                    >
                        {loading ? (
                            <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-brand-navy/[0.04] animate-pulse">
                                        <div className="w-7 h-7 rounded-full bg-brand-navy/5" />
                                        <div className="flex-1 h-3.5 bg-brand-navy/5 rounded w-40" />
                                        <div className="h-5 w-20 bg-brand-navy/5 rounded-lg hidden sm:block" />
                                        <div className="h-5 w-12 bg-brand-navy/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        ) : currentStates.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 flex flex-col items-center gap-3 py-16 text-brand-navy/20">
                                <GitBranch size={32} />
                                <p className="text-sm font-medium">Sin estados configurados</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                                <div className="bg-brand-slate-50/60 border-b border-brand-navy/5 px-5 py-3 flex items-center gap-4">
                                    <span className="text-[10px] font-bold tracking-wide text-brand-navy/40 w-7 text-center">#</span>
                                    <span className="text-[10px] font-bold tracking-wide text-brand-navy/40 flex-1">Nombre visible</span>
                                    <span className="text-[10px] font-bold tracking-wide text-brand-navy/40 hidden sm:block w-20 text-center">Código</span>
                                    <span className="text-[10px] font-bold tracking-wide text-brand-navy/40 w-28 text-right">Acciones</span>
                                </div>
                                <div className="divide-y divide-brand-navy/[0.04]">
                                    {currentStates.map((state, idx) => (
                                        <motion.div
                                            key={state.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.025 }}
                                        >
                                            <StateRow state={state} onUpdated={handleUpdated} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkflowStatesPage;
