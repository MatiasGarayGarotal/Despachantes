import { useState, useEffect } from 'react';
import {
    Mail, ChevronRight, Save, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmailTemplates, updateEmailTemplate } from '../api/emailTemplates';

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

const EmailTemplatesPage = () => {
    const [templates, setTemplates]     = useState([]);
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState({ subject: '', htmlBody: '', active: true });
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [saveStatus, setSaveStatus]   = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getEmailTemplates()
            .then(data => {
                if (!cancelled) {
                    setTemplates(data);
                    if (data.length > 0) selectTemplate(data[0]);
                }
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
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

    return (
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8 bg-brand-slate-50 min-h-screen">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-2xl font-semibold text-brand-navy">Plantillas de Email</h1>
                <p className="text-brand-slate-500 text-sm mt-1">
                    {loading ? 'Cargando...' : `${templates.length} plantilla${templates.length !== 1 ? 's' : ''} configurada${templates.length !== 1 ? 's' : ''}`}
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
                    className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6"
                >
                    {/* Lista de plantillas */}
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

                    {/* Editor de plantilla */}
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
                                    <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">Asunto del email</label>
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
                                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3 px-5 rounded-brand text-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none transition-all shadow-xl shadow-brand-navy/20">
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
                </motion.div>
            )}
        </div>
    );
};

export default EmailTemplatesPage;
