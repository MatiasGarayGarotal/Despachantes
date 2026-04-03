import React, { useState, useEffect } from 'react';
import {
    Mail, ChevronRight, Save, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
    ToggleLeft, ToggleRight, Users, Plus, Pencil, Trash2, X, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmailTemplates, updateEmailTemplate } from '../api/emailTemplates';
import {
    getAllContactTypes, createContactType, updateContactType, deleteContactType, reorderContactTypes,
} from '../api/contactTypes';
import SortableList from '../components/ui/SortableList';

// ─────────────────────────────────────────────────────────────────────────────
// Email Templates Section
// ─────────────────────────────────────────────────────────────────────────────

const VAR_COLORS = [
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-purple-50 text-purple-700 border-purple-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-pink-50 text-pink-700 border-pink-100',
    'bg-teal-50 text-teal-700 border-teal-100',
    'bg-orange-50 text-orange-700 border-orange-100',
    'bg-indigo-50 text-indigo-700 border-indigo-100',
];

const EmailTemplatesSection = () => {
    const [templates, setTemplates]     = useState([]);
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState({ subject: '', htmlBody: '', active: true });
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [saveStatus, setSaveStatus]   = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        getEmailTemplates()
            .then(data => { setTemplates(data); if (data.length > 0) selectTemplate(data[0]); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const selectTemplate = (tpl) => {
        setSelected(tpl);
        setForm({ subject: tpl.subject, htmlBody: tpl.htmlBody, active: tpl.active });
        setSaveStatus(null);
        setShowPreview(false);
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        setSaveStatus(null);
        try {
            const updated = await updateEmailTemplate(selected.id, {
                subject: form.subject, htmlBody: form.htmlBody, active: form.active,
            });
            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelected(updated);
            setSaveStatus('ok');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const variables = selected?.variablesDoc ? JSON.parse(selected.variablesDoc) : [];

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-gold" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <div className="space-y-2">
                {templates.map(tpl => (
                    <button key={tpl.id} onClick={() => selectTemplate(tpl)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selected?.id === tpl.id
                                ? 'bg-white border-brand-gold/40 shadow-md shadow-brand-navy/5'
                                : 'bg-white border-brand-navy/5 hover:border-brand-navy/20'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-brand-navy truncate">{tpl.name}</p>
                                <p className="text-[10px] font-mono text-brand-navy/30 mt-0.5">{tpl.code}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    tpl.active
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>{tpl.active ? 'Activa' : 'Inactiva'}</span>
                                <ChevronRight size={14} className={selected?.id === tpl.id ? 'text-brand-gold' : 'text-brand-navy/20'} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {selected && (
                <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-brand-navy/5 bg-brand-slate-50/60">
                        <div>
                            <p className="font-bold text-brand-navy text-sm">{selected.name}</p>
                            {selected.updatedAt && (
                                <p className="text-[10px] text-brand-navy/30 mt-0.5">
                                    Última edición: {new Date(selected.updatedAt).toLocaleString('es-UY')}
                                    {selected.updatedByName ? ` · ${selected.updatedByName}` : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                                className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                                title={form.active ? 'Desactivar plantilla' : 'Activar plantilla'}>
                                {form.active
                                    ? <ToggleRight size={20} className="text-emerald-500" />
                                    : <ToggleLeft size={20} className="text-brand-navy/20" />}
                                <span className={form.active ? 'text-emerald-600' : 'text-brand-navy/30'}>
                                    {form.active ? 'Activa' : 'Inactiva'}
                                </span>
                            </button>
                            <button onClick={() => setShowPreview(v => !v)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                    showPreview
                                        ? 'bg-brand-navy text-white border-brand-navy'
                                        : 'bg-white text-brand-navy/50 border-brand-navy/10 hover:border-brand-navy/30'
                                }`}>
                                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPreview ? 'Editar' : 'Preview'}
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        {variables.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-brand-navy/40 tracking-wide mb-2">Variables disponibles</p>
                                <div className="flex flex-wrap gap-2">
                                    {variables.map((v, i) => (
                                        <span key={v.var} title={v.desc}
                                            className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border cursor-default ${VAR_COLORS[i % VAR_COLORS.length]}`}>
                                            {`{{${v.var}}}`}
                                            <span className="font-sans font-normal ml-1 opacity-60">{v.desc}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-wide mb-1.5">Asunto del email</label>
                            <input type="text" value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all font-mono"
                                disabled={showPreview} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-wide mb-1.5">
                                {showPreview ? 'Preview del email' : 'HTML del email'}
                            </label>
                            <AnimatePresence mode="wait">
                                {showPreview ? (
                                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="border border-brand-navy/10 rounded-xl overflow-hidden">
                                        <iframe srcDoc={form.htmlBody} className="w-full" style={{ height: '560px', border: 'none' }}
                                            title="Email preview" sandbox="allow-same-origin" />
                                    </motion.div>
                                ) : (
                                    <motion.textarea key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        value={form.htmlBody} onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                                        className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all resize-none"
                                        rows={24} spellCheck={false} />
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3 px-6 rounded-xl text-sm hover:bg-brand-navy/90 disabled:opacity-50 transition-all shadow-lg shadow-brand-navy/20">
                                {saving ? <Loader2 size={16} className="animate-spin text-brand-gold" /> : <Save size={16} className="text-brand-gold" />}
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <AnimatePresence>
                                {saveStatus === 'ok' && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                                        <CheckCircle2 size={16} /> Guardado
                                    </motion.div>
                                )}
                                {saveStatus === 'error' && (
                                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-1.5 text-red-500 text-sm font-bold">
                                        <AlertCircle size={16} /> Error al guardar
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Contact Types Section
// ─────────────────────────────────────────────────────────────────────────────

const emptyTypeForm = { name: '', description: '', sortOrder: 0, isActive: true };

const ContactTypesSection = () => {
    const [types, setTypes]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showNew, setShowNew]       = useState(false);
    const [newForm, setNewForm]       = useState(emptyTypeForm);
    const [creating, setCreating]     = useState(false);
    const [createError, setCreateError] = useState(null);

    const [editingId, setEditingId]   = useState(null);
    const [editForm, setEditForm]     = useState(emptyTypeForm);
    const [saving, setSaving]         = useState(false);
    const [editError, setEditError]   = useState(null);

    const [deleteTarget, setDeleteTarget]   = useState(null);
    const [deleteResult, setDeleteResult]   = useState(null); // { message, physical }
    const [deleting, setDeleting]           = useState(false);

    useEffect(() => {
        getAllContactTypes()
            .then(setTypes)
            .catch(() => setTypes([]))
            .finally(() => setLoading(false));
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

    // Determina si un tipo puede modificar su nombre (la API devolverá 409 si no puede,
    // pero también mostramos el campo como informativo si el type está en uso)
    const isUsed = (type) => !type.isActive; // proxy visual: si está inactivo, fue usado

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand-gold" />
        </div>
    );

    return (
        <div className="space-y-4 max-w-2xl">

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

            {/* Lista de tipos */}
            <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
                {/* Header de tabla */}
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
                    <div className="flex flex-col items-center gap-3 py-10 text-brand-navy/20">
                        <Users size={28} />
                        <p className="text-sm font-medium">Sin tipos configurados</p>
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
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">DESCRIPCIÓN</label>
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
                                                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2 px-5 rounded-brand text-sm shadow-lg shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none">
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
                                    <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">NOMBRE *</label>
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
                                    <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">ORDEN</label>
                                    <input type="number" min="0"
                                        value={newForm.sortOrder}
                                        onChange={e => setNewForm(f => ({ ...f, sortOrder: e.target.value }))}
                                        className="w-20 bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-3 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">DESCRIPCIÓN</label>
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
                                    className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2 px-5 rounded-brand text-sm shadow-lg shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none">
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
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
    { id: 'email',        label: 'Plantillas de email',   icon: Mail },
    { id: 'contactTypes', label: 'Tipos de contacto',     icon: Users },
];

const ConfigPage = ({ initialSection = 'email' }) => {
    const [activeSection, setActiveSection] = useState(initialSection);

    return (
        <div className="p-4 md:p-10 font-sans bg-brand-slate-50 min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-navy tracking-tight">
                    <span className="text-brand-gold italic">Configuración</span>
                </h2>
                <p className="text-brand-slate-500 text-sm mt-1">Gestión de plantillas, tipos de contacto y ajustes del sistema</p>
            </motion.div>

            {/* Nav de secciones */}
            <div className="flex gap-1 mb-8 border-b border-brand-navy/5">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveSection(id)}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider transition-all border-b-2 -mb-px ${
                            activeSection === id
                                ? 'text-brand-navy border-brand-gold'
                                : 'text-brand-navy/30 border-transparent hover:text-brand-navy/60 hover:border-brand-navy/10'
                        }`}>
                        <Icon size={13} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            <AnimatePresence mode="wait">
                {activeSection === 'email' && (
                    <motion.div key="email"
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}>
                        <EmailTemplatesSection />
                    </motion.div>
                )}
                {activeSection === 'contactTypes' && (
                    <motion.div key="contactTypes"
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}>
                        <ContactTypesSection />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConfigPage;
