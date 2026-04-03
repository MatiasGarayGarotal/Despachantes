import { useState, useEffect } from 'react';
import {
    Users, Plus, Pencil, Trash2, X, Check, Loader2, AlertCircle,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAllContactTypes, createContactType, updateContactType, deleteContactType, reorderContactTypes,
} from '../api/contactTypes';
import SortableList from '../components/ui/SortableList';

const emptyTypeForm = { name: '', description: '', sortOrder: 0, isActive: true };

const ContactTypesPage = () => {
    const [types, setTypes]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [showNew, setShowNew]           = useState(false);
    const [newForm, setNewForm]           = useState(emptyTypeForm);
    const [creating, setCreating]         = useState(false);
    const [createError, setCreateError]   = useState(null);

    const [editingId, setEditingId]       = useState(null);
    const [editForm, setEditForm]         = useState(emptyTypeForm);
    const [saving, setSaving]             = useState(false);
    const [editError, setEditError]       = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteResult, setDeleteResult] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAllContactTypes()
            .then(data => { if (!cancelled) setTypes(data); })
            .catch(() => { if (!cancelled) setTypes([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newForm.name.trim()) return;
        setCreating(true);
        setCreateError(null);
        try {
            const created = await createContactType({
                name: newForm.name.trim(),
                description: newForm.description.trim() || null,
                sortOrder: Number(newForm.sortOrder) || 0,
                isActive: true,
            });
            setTypes(prev => [...prev, created]);
            setNewForm(emptyTypeForm);
            setShowNew(false);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Error al crear el tipo.');
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (type) => {
        setEditingId(type.id);
        setEditForm({ name: type.name, description: type.description || '', sortOrder: type.sortOrder, isActive: type.isActive });
        setEditError(null);
    };

    const handleSave = async (id) => {
        setSaving(true);
        setEditError(null);
        try {
            const updated = await updateContactType(id, {
                name: editForm.name.trim(),
                description: editForm.description.trim() || null,
                isActive: editForm.isActive,
            });
            setTypes(prev => prev.map(t => t.id === id ? updated : t));
            setEditingId(null);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const result = await deleteContactType(deleteTarget.id);
            if (result.physical) {
                setTypes(prev => prev.filter(t => t.id !== deleteTarget.id));
            } else {
                setTypes(prev => prev.map(t => t.id === deleteTarget.id ? { ...t, isActive: false } : t));
            }
            setDeleteResult(result);
        } catch (err) {
            setDeleteResult({ message: err.response?.data?.message || 'Error al eliminar.', physical: false });
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleReorder = async (reordered) => {
        const prev = types;
        setTypes(reordered);
        try {
            await reorderContactTypes(reordered.map(t => t.id));
            setTypes(reordered.map((t, i) => ({ ...t, sortOrder: i + 1 })));
        } catch {
            setTypes(prev);
        }
    };

    return (
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8 bg-brand-slate-50 min-h-screen">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-2xl font-semibold text-brand-navy">Tipos de Contacto</h1>
                <p className="text-brand-slate-500 text-sm mt-1">
                    {loading ? 'Cargando...' : `${types.length} tipo${types.length !== 1 ? 's' : ''} configurado${types.length !== 1 ? 's' : ''}`}
                </p>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-brand-gold" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-4 max-w-2xl"
                >
                    {/* Feedback de eliminación */}
                    <AnimatePresence>
                        {deleteResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
                                    deleteResult.physical
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                        : 'bg-amber-50 border-amber-100 text-amber-700'
                                }`}
                            >
                                <div className="shrink-0 mt-0.5">
                                    {deleteResult.physical ? <Check size={16} /> : <AlertCircle size={16} />}
                                </div>
                                <div className="flex-1">{deleteResult.message}</div>
                                <button onClick={() => setDeleteResult(null)} className="shrink-0 opacity-60 hover:opacity-100">
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Lista */}
                    <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-navy/5 bg-brand-slate-50/60">
                            <div className="hidden sm:block w-[26px] shrink-0" />
                            <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto] gap-4">
                                <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">NOMBRE</p>
                                <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">ORDEN</p>
                                <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">ESTADO</p>
                                <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">ACCIONES</p>
                            </div>
                        </div>

                        {types.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-10">
                                <Users size={28} className="text-brand-navy/20" />
                                <p className="text-sm font-medium text-brand-navy/50">Sin tipos configurados</p>
                            </div>
                        ) : (
                            <SortableList
                                items={types}
                                onReorder={handleReorder}
                                disabled={!!editingId}
                                renderItem={(type) => {
                                    if (editingId === type.id) {
                                        return (
                                            <div className="w-full space-y-3 py-1">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">
                                                        NOMBRE {!type.isActive && (
                                                            <span className="text-amber-600 ml-1 normal-case font-normal">
                                                                (en uso — no modificable)
                                                            </span>
                                                        )}
                                                    </label>
                                                    <input
                                                        value={editForm.name}
                                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                        disabled={!type.isActive}
                                                        className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">DESCRIPCIÓN</label>
                                                    <input
                                                        value={editForm.description}
                                                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                                        className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                                        placeholder="Descripción opcional"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button"
                                                        onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                                                        title={editForm.isActive ? 'Desactivar' : 'Activar'}>
                                                        {editForm.isActive
                                                            ? <ToggleRight size={24} className="text-emerald-500" />
                                                            : <ToggleLeft size={24} className="text-brand-navy/20" />}
                                                    </button>
                                                    <span className={`text-xs font-bold ${editForm.isActive ? 'text-emerald-600' : 'text-brand-navy/30'}`}>
                                                        {editForm.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                                {editError && (
                                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-medium flex items-start gap-2">
                                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                        {editError}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 justify-end pt-1">
                                                    <button type="button" onClick={() => { setEditingId(null); setEditError(null); }}
                                                        className="bg-white text-brand-navy font-bold py-2 px-4 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all">
                                                        Cancelar
                                                    </button>
                                                    <button type="button" onClick={() => handleSave(type.id)} disabled={saving}
                                                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2 px-5 rounded-brand text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none">
                                                        {saving ? <Loader2 size={13} className="animate-spin text-brand-gold" /> : <Save size={13} className="text-brand-gold" />}
                                                        {saving ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-brand-navy truncate">{type.name}</p>
                                                {type.description && (
                                                    <p className="text-[11px] text-brand-navy/40 mt-0.5 truncate">{type.description}</p>
                                                )}
                                                <p className="text-[10px] font-mono text-brand-navy/25 mt-0.5">{type.code}</p>
                                            </div>
                                            <p className="text-xs text-brand-navy/40 font-mono">{type.sortOrder}</p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                type.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                                {type.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(type)} title="Editar"
                                                    className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors">
                                                    <Pencil size={13} className="text-brand-navy/40 hover:text-brand-navy/70" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(type)} title="Eliminar"
                                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={13} className="text-brand-navy/30 hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        )}
                    </div>

                    {/* Formulario nuevo tipo */}
                    <AnimatePresence>
                        {showNew && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="bg-white rounded-2xl border border-brand-gold/30 shadow-lg p-5 space-y-3"
                            >
                                <p className="text-[10px] font-bold text-brand-navy/60 tracking-widest">NUEVO TIPO DE CONTACTO</p>
                                <form onSubmit={handleCreate} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">NOMBRE *</label>
                                            <input required
                                                value={newForm.name}
                                                onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                                placeholder="Ej: Jefe de Operaciones"
                                            />
                                            {newForm.name && (
                                                <p className="text-[10px] text-brand-navy/30 mt-1 font-mono">
                                                    Código: {newForm.name.normalize('NFD').replace(/\p{Mn}/gu, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">ORDEN</label>
                                            <input type="number" min="0"
                                                value={newForm.sortOrder}
                                                onChange={e => setNewForm(f => ({ ...f, sortOrder: e.target.value }))}
                                                className="w-20 bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-3 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">DESCRIPCIÓN</label>
                                        <input
                                            value={newForm.description}
                                            onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                                            className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                            placeholder="Descripción opcional del rol"
                                        />
                                    </div>
                                    {createError && (
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                                            {createError}
                                        </div>
                                    )}
                                    <div className="flex gap-2 justify-end pt-1">
                                        <button type="button" onClick={() => { setShowNew(false); setNewForm(emptyTypeForm); setCreateError(null); }}
                                            className="bg-white text-brand-navy font-bold py-2 px-4 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={creating}
                                            className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2 px-5 rounded-brand text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none">
                                            {creating ? <Loader2 size={13} className="animate-spin text-brand-gold" /> : <Plus size={13} className="text-brand-gold" />}
                                            {creating ? 'Creando...' : 'Crear tipo'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Botón nuevo tipo */}
                    {!showNew && (
                        <button onClick={() => setShowNew(true)}
                            className="flex items-center gap-2 text-sm font-bold text-brand-navy/50 hover:text-brand-navy py-2 px-3 rounded-xl hover:bg-white border border-dashed border-brand-navy/15 hover:border-brand-navy/30 transition-all w-full">
                            <Plus size={14} className="text-brand-gold" />
                            Nuevo tipo de contacto
                        </button>
                    )}

                    {/* Modal confirmación de baja */}
                    <AnimatePresence>
                        {deleteTarget && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[65] flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-xl">
                                            <Trash2 size={18} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-brand-navy text-sm">¿Eliminar tipo de contacto?</p>
                                            <p className="text-[11px] text-brand-navy/50 mt-0.5 font-mono">{deleteTarget.name}</p>
                                        </div>
                                    </div>
                                    <div className="bg-brand-slate-50 rounded-xl p-3 text-xs text-brand-navy/60 leading-relaxed">
                                        Si este tipo fue asignado a algún contacto existente, se <strong>desactivará</strong> (baja lógica) en lugar de eliminarse definitivamente.
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                            className="bg-white text-brand-navy font-bold py-2.5 px-4 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all">
                                            Cancelar
                                        </button>
                                        <button onClick={handleDelete} disabled={deleting}
                                            className="flex items-center gap-2 bg-red-500 text-white font-bold py-2.5 px-5 rounded-brand text-sm hover:bg-red-600 transition-all disabled:opacity-50">
                                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                            {deleting ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

export default ContactTypesPage;
