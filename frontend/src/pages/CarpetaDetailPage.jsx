import React, { useState, useEffect } from 'react';
import {
    FolderOpen, FileText, Upload, Trash2, Share2, Download,
    Eye, Loader2, Copy, Check, X, Save, ChevronLeft, ChevronDown,
    Calendar, AlertCircle, Plus, Search, LayoutGrid, LayoutList,
    ArrowDown, ArrowUp, Image,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    updateOperation, getDocumentsByOperation, uploadDocument,
    deleteDocument, downloadDocument, createDocumentShare, sendShareEmail,
    updateDocumentExpiry, getDocumentPreviewUrl,
} from '../api/operations';
import { getDocumentTypes } from '../api/documentTypes';
import { getWorkflowStates } from '../api/workflowStates';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useAppAuth } from '../contexts/AuthContext';
import StatusRing from '../components/ui/StatusRing';
import StateSelector from '../components/ui/StateSelector';
import { OPERATION_TYPES, getOperationTypeBadgeStyle } from '../utils/operationTypes';

// ─── Constantes ───────────────────────────────────────────────────────────────
// Labels y colores visuales por código de estado (los estados vienen dinámicamente de workflow_states)
const STATUS_COLORS = {
    APERTURA:                 'bg-slate-100 text-slate-600',
    DOCUMENTACION_EN_PROCESO: 'bg-blue-50 text-blue-600',
    DOCUMENTACION_COMPLETA:   'bg-blue-100 text-blue-700',
    NUMERADO:                 'bg-amber-50 text-amber-600',
    INGRESO_PUERTO:           'bg-orange-50 text-orange-600',
    CANAL_ASIGNADO:           'bg-amber-100 text-amber-700',
    EN_DEPOSITO:              'bg-purple-50 text-purple-600',
    LEVANTE:                  'bg-teal-50 text-teal-600',
    RETIRADO:                 'bg-teal-100 text-teal-700',
    FACTURADO:                'bg-emerald-50 text-emerald-600',
    CERRADO:                  'bg-emerald-100 text-emerald-700',
};

// ─── Filtro de tipos aplicables ───────────────────────────────────────────────
const filterApplicableTypes = (types, tipo, viaTransporte) => {
    const normalizedTipo = tipo === 'TRANSITO' ? 'IMPORTACION' : tipo;
    return types.filter(t => {
        const matchesTipo = t.appliesTo === 'AMBAS' || t.appliesTo === normalizedTipo;
        const matchesVia  = t.viaTransporte === 'TODAS' || t.viaTransporte === viaTransporte;
        return matchesTipo && matchesVia;
    });
};

const formatBytes = (b) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

const formatDateTime = (iso) => iso
    ? new Date(iso).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
};

// ─── CollapsibleCard — sección colapsable ─────────────────────────────────────
// defaultOpen: si no se pasa, abre solo en md+ (≥768px)
const CollapsibleCard = ({ title, defaultOpen, children, className = '' }) => {
    const [open, setOpen] = useState(() => {
        const init = defaultOpen !== undefined ? defaultOpen : (typeof window !== 'undefined' && window.innerWidth >= 768);
        return init;
    });
    return (
        <div className={`bg-white rounded-2xl border border-brand-navy/5 shadow-sm overflow-hidden ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-slate-50/60 transition-colors"
            >
                <p className="text-[10px] font-bold text-brand-navy/60 tracking-widest">{title}</p>
                <ChevronDown
                    size={14}
                    className={`text-brand-navy/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-brand-navy/5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Componentes de formulario a nivel de módulo ───────────────────────────────
const FormField = ({ label, value, onChange, disabled, ...props }) => (
    <div>
        <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">{label}</label>
        <input
            className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...props}
        />
    </div>
);

const FormSelect = ({ label, value, onChange, options, disabled }) => (
    <div>
        <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">{label}</label>
        <div className="relative">
            <select
                className="w-full appearance-none bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 pr-9 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
                value={value}
                onChange={onChange}
                disabled={disabled}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/40 pointer-events-none">
                <path d="m6 9 6 6 6-6"/>
            </svg>
        </div>
    </div>
);

// ─── ShareModal ───────────────────────────────────────────────────────────────
const ShareModal = ({ doc, clientEmail, onClose }) => {
    const [activeShareTab, setActiveShareTab] = useState('link');
    const [loading, setLoading]       = useState(true);
    const [share, setShare]           = useState(null);
    const [copied, setCopied]         = useState(false);
    const [error, setError]           = useState(null);
    const [emailTo, setEmailTo]       = useState(clientEmail || '');
    const [sending, setSending]       = useState(false);
    const [emailStatus, setEmailStatus] = useState(null);

    useEffect(() => {
        const generate = async () => {
            setLoading(true); setError(null);
            try { setShare(await createDocumentShare(doc.id)); }
            catch { setError('No se pudo generar el link. Intenta nuevamente.'); }
            finally { setLoading(false); }
        };
        generate();
    }, [doc.id]);

    const copyLink = () => {
        if (!share) return;
        navigator.clipboard.writeText(share.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmail = async () => {
        if (!share) return;
        setSending(true); setEmailStatus(null);
        try {
            await sendShareEmail(share.token, emailTo || null);
            setEmailStatus('sent');
        } catch { setEmailStatus('error'); }
        finally { setSending(false); }
    };

    const tabs = [
        { id: 'link',  label: 'Link',  icon: <Copy size={13} /> },
        { id: 'email', label: 'Email', icon: <Share2 size={13} /> },
    ];

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
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h3 className="font-display font-bold text-brand-navy text-base">Compartir documento</h3>
                        <p className="text-xs text-brand-navy/50 mt-0.5 truncate max-w-xs">{doc.fileName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-brand-slate-50 rounded-lg">
                        <X size={18} className="text-brand-navy/50" />
                    </button>
                </div>

                <div className="flex gap-1 bg-brand-slate-50 rounded-xl p-1 mb-5">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveShareTab(t.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeShareTab === t.id
                                    ? 'bg-white text-brand-navy shadow-sm'
                                    : 'text-brand-navy/50 hover:text-brand-navy/80'
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-brand-navy/50">
                        <Loader2 size={16} className="animate-spin text-brand-gold" />
                        <span className="text-sm">Generando link...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-600 mb-4">{error}</div>
                )}

                {!loading && share && activeShareTab === 'link' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-brand-slate-50 border border-brand-navy/10 rounded-xl p-3">
                            <p className="text-xs text-brand-navy/60 flex-1 truncate font-mono">{share.shareUrl}</p>
                            <button
                                onClick={copyLink}
                                className={`shrink-0 p-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-white text-brand-navy/50 hover:text-brand-navy'}`}
                                title="Copiar link"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-brand-navy/50">Válido hasta: {formatDateTime(share.expiresAt)}</p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <a href={share.shareUrl} target="_blank" rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 bg-white border border-brand-navy/10 text-brand-navy font-bold py-3 rounded-xl text-xs hover:border-brand-navy/30 transition-all">
                                <Eye size={13} /> Ver landing
                            </a>
                            <button
                                onClick={copyLink}
                                className={`flex items-center justify-center gap-1.5 font-bold py-3 rounded-xl text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'}`}
                            >
                                {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar link</>}
                            </button>
                        </div>
                    </div>
                )}

                {!loading && activeShareTab === 'email' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">DESTINATARIO</label>
                            <input
                                type="email"
                                placeholder="correo@destinatario.com"
                                value={emailTo}
                                onChange={e => { setEmailTo(e.target.value); setEmailStatus(null); }}
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                disabled={sending || emailStatus === 'sent'}
                            />
                            {clientEmail && emailTo === clientEmail && (
                                <p className="text-[10px] text-brand-navy/50 mt-1">Email del cliente precargado</p>
                            )}
                        </div>
                        <button
                            onClick={handleSendEmail}
                            disabled={!share || !emailTo || sending || emailStatus === 'sent'}
                            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl text-sm transition-all ${
                                emailStatus === 'sent' ? 'bg-emerald-500 text-white'
                                : emailStatus === 'error' ? 'bg-red-500 text-white'
                                : 'bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-40'
                            }`}
                        >
                            {sending ? <Loader2 size={15} className="animate-spin" />
                                : emailStatus === 'sent' ? <><Check size={15} /> Email enviado</>
                                : emailStatus === 'error' ? 'Error al enviar'
                                : <><Share2 size={15} className="text-brand-gold" /> Enviar por email</>}
                        </button>
                        {emailStatus === 'error' && <p className="text-[11px] text-red-500">No se pudo enviar el email.</p>}
                        {!share && !loading && <p className="text-[11px] text-brand-navy/50">Esperando link...</p>}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// ─── PreviewModal — previsualizador mobile-first ──────────────────────────────
const PreviewModal = ({ doc, onClose }) => {
    const [url, setUrl]         = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!doc?.id) return;
        let cancelled = false;
        setLoading(true); setError(null); setUrl(null);
        getDocumentPreviewUrl(doc.id)
            .then(previewUrl => { if (!cancelled) { setUrl(previewUrl); setLoading(false); } })
            .catch(() => { if (!cancelled) { setError('No se pudo cargar el documento.'); setLoading(false); } });
        return () => { cancelled = true; };
    }, [doc?.id]);

    const isImage    = doc?.contentType?.startsWith('image/');
    const isPdf      = doc?.contentType === 'application/pdf';
    const canPreview = isImage || isPdf;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm" />
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-navy/5 shrink-0">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-brand-navy/50 tracking-widest">{doc.documentTypeName || 'Documento'}</p>
                        <p className="text-sm font-semibold text-brand-navy truncate max-w-[240px] sm:max-w-md">{doc.fileName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button
                            onClick={() => downloadDocument(doc.id, doc.fileName)}
                            className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors"
                            title="Descargar"
                        >
                            <Download size={15} className="text-brand-navy/60" />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-brand-slate-50 rounded-lg transition-colors" title="Cerrar">
                            <X size={18} className="text-brand-navy/50" />
                        </button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 overflow-hidden flex items-center justify-center bg-brand-slate-50">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 text-brand-navy/50">
                            <Loader2 size={24} className="animate-spin text-brand-gold" />
                            <span className="text-sm">Cargando documento...</span>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="flex flex-col items-center gap-3 text-brand-navy/50 px-6 text-center">
                            <FileText size={36} className="text-brand-navy/20" />
                            <p className="text-sm font-medium text-brand-navy/70">{error}</p>
                        </div>
                    )}
                    {!loading && url && canPreview && isImage && (
                        <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                            <img src={url} alt={doc.fileName} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                        </div>
                    )}
                    {!loading && url && canPreview && isPdf && (
                        <iframe
                            src={url}
                            title={doc.fileName}
                            className="w-full h-full"
                            style={{ minHeight: '300px' }}
                        />
                    )}
                    {!loading && url && !canPreview && (
                        <div className="flex flex-col items-center gap-4 px-6 text-center">
                            <FileText size={44} className="text-brand-navy/20" />
                            <div>
                                <p className="text-sm font-semibold text-brand-navy">Sin previsualización disponible</p>
                                <p className="text-xs text-brand-navy/50 mt-1">Este tipo de archivo no puede mostrarse en el navegador</p>
                            </div>
                            <button
                                onClick={() => downloadDocument(doc.id, doc.fileName)}
                                className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3 px-5 rounded-xl text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Download size={14} className="text-brand-gold" /> Descargar archivo
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── ConfirmModal genérico ────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel, children }) => (
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
            <h3 className="font-display font-bold text-brand-navy text-base mb-2">{title}</h3>
            <p className="text-sm text-brand-navy/70 mb-4">{message}</p>
            {children}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={onCancel}
                    className="py-3 rounded-xl font-bold text-sm text-brand-navy/70 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                    Cancelar
                </button>
                <button onClick={onConfirm}
                    className={`py-3 rounded-xl font-bold text-sm text-white transition-all ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-navy hover:bg-brand-navy/90'}`}>
                    {confirmLabel}
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ─── DocThumbnail — miniatura o ícono para vista grilla ──────────────────────
const DocThumbnail = ({ doc }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const isImage = doc?.contentType?.startsWith('image/');

    useEffect(() => {
        if (!isImage || !doc?.id) return;
        let cancelled = false;
        getDocumentPreviewUrl(doc.id)
            .then(u => { if (!cancelled) setPreviewUrl(u); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [doc?.id, isImage]);

    if (isImage && previewUrl) {
        return <img src={previewUrl} alt={doc.fileName} className="w-full h-full object-cover" />;
    }
    const isPdf  = doc?.contentType === 'application/pdf';
    const isDocx = doc?.contentType?.includes('word') || /\.(docx?)$/i.test(doc?.fileName || '');
    const isXlsx = doc?.contentType?.includes('spreadsheet') || doc?.contentType?.includes('excel') || /\.(xlsx?)$/i.test(doc?.fileName || '');

    if (isImage) return <div className="w-full h-full flex items-center justify-center"><Image size={28} className="text-purple-300" /></div>;
    if (isPdf)   return <div className="w-full h-full flex items-center justify-center bg-red-50/60"><FileText size={28} className="text-red-300" /></div>;
    if (isDocx)  return <div className="w-full h-full flex items-center justify-center bg-blue-50/60"><FileText size={28} className="text-blue-300" /></div>;
    if (isXlsx)  return <div className="w-full h-full flex items-center justify-center bg-green-50/60"><FileText size={28} className="text-green-300" /></div>;
    return <div className="w-full h-full flex items-center justify-center"><FileText size={28} className="text-brand-navy/20" /></div>;
};

// ─── DocumentCard — tarjeta por tipo de documento ─────────────────────────────
const DocumentCard = ({ docType, doc, onUpload, onUpdateExpiry, onDelete, onShare, onDownload, onPreview, canEdit, viewMode = 'list', isObligatorio = false }) => {
    const [picking, setPicking]       = useState(false);
    const [file, setFile]             = useState(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [uploading, setUploading]   = useState(false);
    const [error, setError]           = useState(null);
    const [newExpiry, setNewExpiry]   = useState('');
    const [savingExpiry, setSavingExpiry] = useState(false);

    const isComplete  = doc && (!docType.hasExpiration || doc.expirationDate);
    const needsExpiry = doc && docType.hasExpiration && !doc.expirationDate;

    const handleUpload = async () => {
        if (!file) return;
        if (docType.hasExpiration && !expiryDate) { setError('La fecha de vencimiento es obligatoria'); return; }
        setUploading(true); setError(null);
        try {
            await onUpload(file, docType.code, expiryDate || null);
            setPicking(false); setFile(null); setExpiryDate('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al subir el archivo');
        } finally { setUploading(false); }
    };

    const handleSaveExpiry = async () => {
        if (!newExpiry) return;
        setSavingExpiry(true);
        try { await onUpdateExpiry(doc.id, newExpiry); }
        catch {}
        finally { setSavingExpiry(false); }
    };

    const expired = doc?.expirationDate ? isExpired(doc.expirationDate) : false;

    // ── VISTA GRILLA ──────────────────────────────────────────────────────────
    if (viewMode === 'grid') {
        if (doc) {
            return (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${
                        expired ? 'border-brand-accent/30' : isComplete ? 'border-emerald-100' : 'border-amber-200'
                    }`}>
                    <div className="h-28 relative overflow-hidden bg-brand-slate-50">
                        <DocThumbnail doc={doc} />
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            {isObligatorio && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-gold text-brand-navy leading-tight shadow-sm">OBL</span>
                            )}
                            {expired && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-accent text-white leading-tight shadow-sm">VENCIDO</span>
                            )}
                            {needsExpiry && !expired && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-white leading-tight shadow-sm">SIN FECHA</span>
                            )}
                        </div>
                    </div>
                    <div className="px-3 pt-2 pb-1 flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-brand-navy/50 tracking-widest truncate">{docType.name}</p>
                        <p className="text-xs font-semibold text-brand-navy truncate mt-0.5">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] text-brand-navy/40">{formatBytes(doc.fileSizeBytes)}</span>
                            {doc.expirationDate && (
                                <span className={`text-[9px] flex items-center gap-0.5 ${expired ? 'text-brand-accent font-bold' : 'text-brand-navy/40'}`}>
                                    <Calendar size={7} /> {formatDate(doc.expirationDate)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 px-2 pb-2 pt-1 border-t border-brand-navy/5">
                        <button onClick={() => onPreview(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Previsualizar">
                            <Eye size={13} className="text-brand-navy/50" />
                        </button>
                        <button onClick={() => onDownload(doc.id, doc.fileName)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Descargar">
                            <Download size={13} className="text-brand-navy/50" />
                        </button>
                        <button onClick={() => onShare(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-gold/10 rounded-lg transition-colors" title="Compartir">
                            <Share2 size={13} className="text-brand-gold" />
                        </button>
                        {canEdit && (
                            <button onClick={() => onDelete(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 size={13} className="text-red-400" />
                            </button>
                        )}
                    </div>
                </motion.div>
            );
        } else {
            return (
                <div className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col ${picking ? 'border-brand-gold/40' : 'border-brand-navy/[0.08]'}`}>
                    <div className="h-28 relative bg-brand-slate-50 flex items-center justify-center">
                        <FileText size={24} className="text-brand-navy/20" />
                        {isObligatorio && (
                            <div className="absolute top-2 right-2">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-gold text-brand-navy leading-tight shadow-sm">OBL</span>
                            </div>
                        )}
                    </div>
                    <div className="px-3 pt-2 pb-1 flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-brand-navy/50 tracking-widest truncate">{docType.name}</p>
                        <p className="text-[10px] text-brand-navy/40 mt-0.5">Sin adjuntar</p>
                    </div>
                    {canEdit && (
                        <div className="px-2 pb-2">
                            <AnimatePresence>
                                {picking ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                        <label className={`flex items-center gap-2 cursor-pointer bg-brand-slate-50 border rounded-lg py-2 px-3 hover:border-brand-gold/40 transition-all ${file ? 'border-brand-gold/40' : 'border-brand-navy/10'}`}>
                                            <Upload size={11} className="text-brand-navy/50 shrink-0" />
                                            <span className="text-[10px] text-brand-navy/70 truncate flex-1">{file ? file.name : 'Seleccionar...'}</span>
                                            <input type="file" className="hidden" onChange={e => { setFile(e.target.files[0] || null); setError(null); }} />
                                        </label>
                                        {file && docType.hasExpiration && (
                                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-lg py-1.5 px-3 text-[10px] outline-none focus:border-brand-gold/60 transition-all" />
                                        )}
                                        {error && <p className="text-[10px] text-red-500">{error}</p>}
                                        <div className="flex gap-1">
                                            <button onClick={() => { setPicking(false); setFile(null); setExpiryDate(''); setError(null); }}
                                                className="py-1.5 px-2 rounded-lg font-bold text-[10px] text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                                                <X size={11} />
                                            </button>
                                            <button onClick={handleUpload}
                                                disabled={!file || uploading || (docType.hasExpiration && !expiryDate)}
                                                className="flex-1 flex items-center justify-center gap-1 bg-brand-navy text-white font-bold py-1.5 rounded-lg text-[10px] disabled:opacity-40 hover:bg-brand-navy/90 transition-all">
                                                {uploading ? <Loader2 size={10} className="animate-spin text-brand-gold" /> : <><Upload size={10} className="text-brand-gold" /> Subir</>}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <button onClick={() => setPicking(true)}
                                        className="w-full flex items-center justify-center gap-1 bg-brand-navy/5 hover:bg-brand-navy text-brand-navy/60 hover:text-white font-bold py-1.5 rounded-lg text-[10px] transition-all">
                                        <Upload size={11} /> Adjuntar
                                    </button>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            );
        }
    }

    // ── Completo ─────────────────────────────────────────────────────────────
    if (isComplete) {
        return (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-emerald-600/70 tracking-widest">{docType.name}</p>
                        <p className="text-sm font-semibold text-brand-navy truncate mt-0.5">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-brand-navy/50">{formatBytes(doc.fileSizeBytes)}</span>
                            {doc.expirationDate && (
                                <span className={`text-[10px] flex items-center gap-1 ${expired ? 'text-brand-accent font-bold' : 'text-brand-navy/50'}`}>
                                    <Calendar size={9} /> Vence: {formatDate(doc.expirationDate)}
                                </span>
                            )}
                        </div>
                        {(isObligatorio || expired) && (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                                {isObligatorio && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-gold/20 text-brand-gold leading-tight">OBLIGATORIO</span>
                                )}
                                {expired && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-accent/15 text-brand-accent leading-tight">VENCIDO</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onPreview(doc)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Previsualizar">
                            <Eye size={14} className="text-brand-navy/60" />
                        </button>
                        <button onClick={() => onDownload(doc.id, doc.fileName)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Descargar">
                            <Download size={14} className="text-brand-navy/60" />
                        </button>
                        <button onClick={() => onShare(doc)} className="p-1.5 hover:bg-brand-gold/10 rounded-lg transition-colors" title="Compartir">
                            <Share2 size={14} className="text-brand-gold" />
                        </button>
                        {canEdit && (
                            <button onClick={() => onDelete(doc)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 size={14} className="text-red-400" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Falta fecha ──────────────────────────────────────────────────────────
    if (needsExpiry) {
        return (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-amber-600/70 tracking-widest">{docType.name}</p>
                            <p className="text-sm font-semibold text-brand-navy truncate">{doc.fileName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => onPreview(doc)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Previsualizar">
                                <Eye size={13} className="text-brand-navy/60" />
                            </button>
                            <button onClick={() => onDownload(doc.id, doc.fileName)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors" title="Descargar">
                                <Download size={13} className="text-brand-navy/60" />
                            </button>
                            {canEdit && (
                                <button onClick={() => onDelete(doc)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                    <Trash2 size={13} className="text-red-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    {canEdit && (
                        <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                            <p className="text-[10px] font-bold text-amber-700/80 tracking-widest">FECHA DE VENCIMIENTO REQUERIDA</p>
                            {docType.expiryHint && <p className="text-[10px] text-amber-600/70">{docType.expiryHint}</p>}
                            <div className="flex gap-2">
                                <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                                    className="flex-1 bg-white border border-amber-200 rounded-lg py-2 px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                                <button onClick={handleSaveExpiry} disabled={!newExpiry || savingExpiry}
                                    className="flex items-center gap-1.5 bg-amber-500 text-white font-bold py-2 px-3 rounded-lg text-xs disabled:opacity-40 hover:bg-amber-600 transition-all">
                                    {savingExpiry ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // ── Vacío / seleccionando ────────────────────────────────────────────────
    return (
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${picking ? 'border-brand-gold/40' : 'border-brand-navy/[0.08]'}`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-brand-slate-50 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-brand-navy/30" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-brand-navy/50 tracking-widest">{docType.name}</p>
                    <p className="text-xs text-brand-navy/50 mt-0.5">Sin adjuntar</p>
                </div>
                {canEdit && !picking && (
                    <button onClick={() => setPicking(true)}
                        className="shrink-0 flex items-center gap-1.5 bg-brand-navy/5 hover:bg-brand-navy text-brand-navy/60 hover:text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all">
                        <Upload size={12} /> Adjuntar
                    </button>
                )}
            </div>
            <AnimatePresence>
                {picking && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 border-t border-brand-navy/5 pt-3">
                            <label className={`flex items-center gap-3 cursor-pointer bg-brand-slate-50 border rounded-xl py-3 px-4 hover:border-brand-gold/40 transition-all ${file ? 'border-brand-gold/40' : 'border-brand-navy/10'}`}>
                                <Upload size={14} className="text-brand-navy/50 shrink-0" />
                                <span className="text-sm text-brand-navy/70 truncate flex-1">{file ? file.name : 'Seleccionar archivo...'}</span>
                                <input type="file" className="hidden" onChange={e => { setFile(e.target.files[0] || null); setError(null); }} />
                            </label>
                            <AnimatePresence>
                                {file && docType.hasExpiration && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest">FECHA DE VENCIMIENTO</label>
                                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all" />
                                            {docType.expiryHint && <p className="text-[10px] text-brand-navy/40">{docType.expiryHint}</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex gap-2">
                                <button onClick={() => { setPicking(false); setFile(null); setExpiryDate(''); setError(null); }}
                                    className="py-2.5 px-4 rounded-xl font-bold text-xs text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleUpload}
                                    disabled={!file || uploading || (docType.hasExpiration && !expiryDate)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-navy text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-40 hover:bg-brand-navy/90 transition-all">
                                    {uploading
                                        ? <><Loader2 size={13} className="animate-spin text-brand-gold" /> Subiendo...</>
                                        : <><Upload size={13} className="text-brand-gold" /> Subir</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── AddOtherForm — agregar documento fuera de los tipos aplicables ────────────
const AddOtherForm = ({ allDocTypes, onUpload }) => {
    const [open, setOpen]             = useState(false);
    const [typeCode, setTypeCode]     = useState('');
    const [file, setFile]             = useState(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [uploading, setUploading]   = useState(false);
    const [error, setError]           = useState(null);

    const selectedType = allDocTypes.find(t => t.code === typeCode);

    const handleUpload = async () => {
        if (!file || !typeCode) return;
        if (selectedType?.hasExpiration && !expiryDate) { setError('La fecha de vencimiento es obligatoria'); return; }
        setUploading(true); setError(null);
        try {
            await onUpload(file, typeCode, expiryDate || null);
            setOpen(false); setFile(null); setTypeCode(''); setExpiryDate('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al subir el archivo');
        } finally { setUploading(false); }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-navy/10 rounded-xl py-3 text-xs font-bold text-brand-navy/40 hover:border-brand-gold/30 hover:text-brand-navy/60 transition-all">
                <Plus size={14} /> Agregar otro documento
            </button>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border border-brand-navy/10 rounded-xl p-4 space-y-3 bg-white">
            <div>
                <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">TIPO DE DOCUMENTO</label>
                <SearchableSelect
                    value={typeCode}
                    onChange={setTypeCode}
                    options={allDocTypes.map(t => ({ value: t.code, label: t.name }))}
                    placeholder="Buscar tipo de documento..."
                />
            </div>
            <label className={`flex items-center gap-3 cursor-pointer bg-brand-slate-50 border rounded-xl py-3 px-4 hover:border-brand-gold/40 transition-all ${file ? 'border-brand-gold/40' : 'border-brand-navy/10'}`}>
                <Upload size={14} className="text-brand-navy/50 shrink-0" />
                <span className="text-sm text-brand-navy/70 truncate">{file ? file.name : 'Seleccionar archivo...'}</span>
                <input type="file" className="hidden" onChange={e => { setFile(e.target.files[0] || null); setError(null); }} />
            </label>
            <AnimatePresence>
                {file && selectedType?.hasExpiration && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest">FECHA DE VENCIMIENTO</label>
                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all" />
                            {selectedType.expiryHint && <p className="text-[10px] text-brand-navy/40">{selectedType.expiryHint}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
                <button onClick={() => { setOpen(false); setFile(null); setTypeCode(''); setExpiryDate(''); setError(null); }}
                    className="py-2.5 px-4 rounded-xl font-bold text-xs text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all">
                    Cancelar
                </button>
                <button onClick={handleUpload}
                    disabled={!file || !typeCode || uploading || (selectedType?.hasExpiration && !expiryDate)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-navy text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-40 hover:bg-brand-navy/90 transition-all">
                    {uploading
                        ? <><Loader2 size={13} className="animate-spin text-brand-gold" /> Subiendo...</>
                        : <><Upload size={13} className="text-brand-gold" /> Subir</>}
                </button>
            </div>
        </motion.div>
    );
};

// ─── CarpetaDetailPage ────────────────────────────────────────────────────────
const CarpetaDetailPage = ({ carpeta, fromClient, onNavigate, onSaved }) => {
    const { hasPermission } = useAppAuth();
    const canEdit = hasPermission('PAGE_OPERACIONES');

    const [form, setForm] = useState({
        tipo:                  carpeta.tipo || 'IMPORTACION',
        viaTransporte:         carpeta.viaTransporte || 'MARITIMA',
        proveedor:             carpeta.proveedor || '',
        descripcionMercaderia: carpeta.descripcionMercaderia || '',
        valorEstimado:         carpeta.valorEstimado || '',
        estado:                carpeta.estado || 'APERTURA',
    });
    const [saving, setSaving]       = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveOk, setSaveOk]       = useState(false);

    const [documents, setDocuments]       = useState([]);
    const [docsLoading, setDocsLoading]   = useState(false);
    const [docTypes, setDocTypes]         = useState([]);
    const [shareDoc, setShareDoc]         = useState(null);
    const [previewDoc, setPreviewDoc]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [docSearch, setDocSearch] = useState('');
    const [docSort, setDocSort]     = useState('desc');
    const [docView, setDocView]     = useState('list');

    const [pendingState, setPendingState]   = useState(null);
    const [stateChanging, setStateChanging] = useState(false);
    const [activeTab, setActiveTab]         = useState('datos');
    const [workflowStates, setWorkflowStates] = useState([]);
    const [workflowLoading, setWorkflowLoading] = useState(false);

    useEffect(() => {
        if (activeTab !== 'documentos') return;
        let cancelled = false;
        setDocsLoading(true);
        Promise.all([getDocumentsByOperation(carpeta.id), getDocumentTypes()])
            .then(([docs, types]) => { if (!cancelled) { setDocuments(docs); setDocTypes(types); } })
            .catch(() => { if (!cancelled) { setDocuments([]); setDocTypes([]); } })
            .finally(() => { if (!cancelled) setDocsLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, carpeta.id]);

    // Cargar estados de workflow según el tipo de operación
    useEffect(() => {
        if (!carpeta?.tipo) return;
        let cancelled = false;
        setWorkflowLoading(true);
        getWorkflowStates(carpeta.tipo)
            .then(states => {
                if (!cancelled) {
                    setWorkflowStates(
                        states
                            .filter(s => s.isActive)
                            .sort((a, b) => a.stepOrder - b.stepOrder)
                            .map(s => ({ key: s.code, label: s.name }))
                    );
                }
            })
            .catch(() => { if (!cancelled) setWorkflowStates([]); })
            .finally(() => { if (!cancelled) setWorkflowLoading(false); });
        return () => { cancelled = true; };
    }, [carpeta?.tipo]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setSaveError(null); setSaveOk(false);
        try {
            const payload = {
                ...form,
                valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : null,
            };
            const saved = await updateOperation(carpeta.id, payload);
            setSaveOk(true);
            onSaved?.(saved);
            setTimeout(() => setSaveOk(false), 2000);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Error al guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    const confirmStateChange = async () => {
        if (!pendingState) return;
        setStateChanging(true);
        try {
            const saved = await updateOperation(carpeta.id, { estado: pendingState });
            setForm(f => ({ ...f, estado: pendingState }));
            onSaved?.(saved);
        } catch {}
        finally {
            setStateChanging(false);
            setPendingState(null);
        }
    };

    const handleDocUpload = async (file, typeCode, expiryDate) => {
        const doc = await uploadDocument(carpeta.id, file, typeCode, expiryDate);
        setDocuments(prev => [doc, ...prev.filter(d => d.documentTypeCode !== typeCode)]);
    };

    const handleUpdateExpiry = async (docId, expiryDate) => {
        const updated = await updateDocumentExpiry(docId, expiryDate);
        setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDocument(deleteTarget.id);
            setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
        } catch {}
        finally { setDeleteTarget(null); }
    };

    const statusColor  = STATUS_COLORS[form.estado] || 'bg-slate-100 text-slate-600';
    const statusLabel  = workflowStates.find(s => s.key === form.estado)?.label ?? form.estado;
    const pendingLabel = workflowStates.find(s => s.key === pendingState)?.label ?? '';
    const pendingIdx   = workflowStates.findIndex(s => s.key === pendingState);
    const currentIdx   = workflowStates.findIndex(s => s.key === form.estado);
    const isGoingBack = pendingState !== null && pendingIdx < currentIdx;

    return (
        <div className="flex flex-col h-full overflow-hidden font-sans">

            {/* Cabecera fija — más compacta en mobile */}
            <div className="px-3 md:px-8 pt-3 md:pt-5 pb-0 shrink-0">

                {/* Breadcrumb + botón volver */}
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <button
                        onClick={() => onNavigate(fromClient ? 'clientes' : 'expedientes', fromClient ? { restoreClient: fromClient } : undefined)}
                        className="p-1.5 bg-white rounded-lg border border-brand-navy/10 hover:border-brand-gold/40 transition-colors group shrink-0"
                        title="Volver"
                    >
                        <ChevronLeft size={15} className="text-brand-navy/50 group-hover:text-brand-gold transition-colors" />
                    </button>
                    <nav className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                        <button
                            onClick={() => onNavigate(fromClient ? 'clientes' : 'expedientes')}
                            className="text-brand-navy/50 hover:text-brand-gold transition-colors whitespace-nowrap"
                        >
                            {fromClient ? 'Clientes' : 'Carpetas'}
                        </button>
                        {fromClient && (
                            <>
                                <span className="text-brand-navy/30 shrink-0">›</span>
                                <button
                                    onClick={() => onNavigate('clientes', { restoreClient: fromClient })}
                                    className="text-brand-navy/50 hover:text-brand-gold transition-colors max-w-[80px] md:max-w-[140px] truncate"
                                >
                                    {fromClient.razonSocial}
                                </button>
                            </>
                        )}
                        <span className="text-brand-navy/30 shrink-0">›</span>
                        <span className="text-brand-navy font-bold truncate">{carpeta.nroCarpeta}</span>
                    </nav>
                </div>

                {/* Tarjeta de identidad */}
                <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm">
                    <div className="p-3 md:p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-2.5 bg-brand-navy rounded-xl shrink-0">
                                <FolderOpen size={16} className="text-brand-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-lg font-mono font-bold text-brand-navy tracking-tight leading-tight">
                                            {carpeta.nroCarpeta}
                                        </h2>
                                        <p className="text-xs md:text-sm text-brand-navy/70 mt-0.5 truncate">
                                            {carpeta.razonSocial}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                        <span style={getOperationTypeBadgeStyle(form.tipo)} className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                            {OPERATION_TYPES.find(t => t.value === form.tipo)?.shortLabel || form.tipo}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                                {/* Metadata — oculto en mobile para ganar espacio */}
                                <div className="hidden md:flex items-center gap-4 mt-2.5 pt-2.5 border-t border-brand-navy/5 text-[10px] text-brand-navy/50 font-medium flex-wrap">
                                    <span>Apertura: {carpeta.fechaApertura}</span>
                                    {carpeta.viaTransporte && (
                                        <span>Vía: {carpeta.viaTransporte.charAt(0) + carpeta.viaTransporte.slice(1).toLowerCase()}</span>
                                    )}
                                    {carpeta.fechaLevante && <span>Levante: {carpeta.fechaLevante}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-brand-navy/5 px-2">
                        {[
                            { id: 'datos',      label: 'Datos',      Icon: FolderOpen },
                            { id: 'documentos', label: 'Docs',       Icon: FileText },
                            { id: 'estado',     label: 'Estado',     Icon: null },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                                    activeTab === id
                                        ? 'text-brand-navy border-brand-gold'
                                        : 'text-brand-navy/40 border-transparent hover:text-brand-navy/70'
                                }`}
                            >
                                {Icon && <Icon size={11} />}
                                {id === 'estado' && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor.split(' ')[0]}`} />
                                )}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto px-3 md:px-8 pt-3 pb-8">

                {/* ── TAB: Datos ──────────────────────────────────────────────── */}
                {activeTab === 'datos' && (
                    <form onSubmit={handleSave} className="max-w-2xl">
                        <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-4 md:p-6 space-y-4 md:space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">Nro. Carpeta</label>
                                    <input
                                        className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm opacity-60 cursor-default"
                                        value={carpeta.nroCarpeta}
                                        disabled readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">Cliente</label>
                                    <input
                                        className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm opacity-60 cursor-default"
                                        value={carpeta.razonSocial}
                                        disabled readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormSelect
                                    label="Tipo de operación"
                                    value={form.tipo}
                                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                    disabled={!canEdit}
                                    options={[
                                        { value: 'IMPORTACION', label: 'Importación' },
                                        { value: 'EXPORTACION', label: 'Exportación' },
                                    ]}
                                />
                                <FormSelect
                                    label="Vía de transporte"
                                    value={form.viaTransporte}
                                    onChange={e => setForm(f => ({ ...f, viaTransporte: e.target.value }))}
                                    disabled={!canEdit}
                                    options={[
                                        { value: 'MARITIMA',  label: 'Marítima' },
                                        { value: 'TERRESTRE', label: 'Terrestre' },
                                        { value: 'AEREA',     label: 'Aérea' },
                                    ]}
                                />
                            </div>

                            <FormField
                                label="Proveedor / Exportador"
                                value={form.proveedor}
                                onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                                disabled={!canEdit}
                                placeholder="Empresa proveedora SA"
                            />

                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy/60 tracking-widest mb-1.5">Descripción de mercadería</label>
                                <textarea
                                    className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all resize-none disabled:opacity-50"
                                    rows={3}
                                    placeholder="Descripción de la mercadería..."
                                    value={form.descripcionMercaderia}
                                    onChange={e => setForm(f => ({ ...f, descripcionMercaderia: e.target.value }))}
                                    disabled={!canEdit}
                                />
                            </div>

                            <FormField
                                label="Valor estimado (USD)"
                                value={form.valorEstimado}
                                onChange={e => setForm(f => ({ ...f, valorEstimado: e.target.value }))}
                                disabled={!canEdit}
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                            />

                            {saveError && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-600 font-medium">
                                    {saveError}
                                </div>
                            )}

                            {canEdit && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-bold text-sm transition-all shadow-lg ${
                                        saveOk
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-50'
                                    }`}
                                >
                                    {saving && <Loader2 size={16} className="animate-spin text-brand-gold" />}
                                    {saveOk ? '✓ Guardado' : saving ? 'Guardando...' : <><Save size={15} /> Guardar cambios</>}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* ── TAB: Documentos ─────────────────────────────────────────── */}
                {activeTab === 'documentos' && (() => {
                    const applicable      = filterApplicableTypes(docTypes, carpeta.tipo, carpeta.viaTransporte);
                    const obligatorios    = applicable.filter(t => t.isAlwaysRequired);
                    const opcionales      = applicable.filter(t => !t.isAlwaysRequired);
                    const applicableCodes = new Set(applicable.map(t => t.code));
                    const docsMap = {};
                    [...documents].reverse().forEach(d => { if (d.documentTypeCode) docsMap[d.documentTypeCode] = d; });
                    const otherDocs = documents.filter(d => !applicableCodes.has(d.documentTypeCode));

                    const countComplete = (types) => types.filter(t => {
                        const d = docsMap[t.code];
                        return d && (!t.hasExpiration || d.expirationDate);
                    }).length;

                    // ── Filtrado y ordenamiento (cliente) ─────────────────────────
                    const searchLower = docSearch.toLowerCase().trim();
                    const matchesSearch = (dt, doc) => {
                        if (!searchLower) return true;
                        return dt.name.toLowerCase().includes(searchLower) ||
                               (doc?.fileName || '').toLowerCase().includes(searchLower);
                    };
                    const sortDocTypes = (types) => [...types].sort((a, b) => {
                        const docA = docsMap[a.code];
                        const docB = docsMap[b.code];
                        if (!docA && !docB) return 0;
                        if (!docA) return 1;
                        if (!docB) return -1;
                        return docSort === 'desc'
                            ? new Date(docB.createdAt) - new Date(docA.createdAt)
                            : new Date(docA.createdAt) - new Date(docB.createdAt);
                    });
                    const filteredObligatorios = sortDocTypes(obligatorios).filter(dt => matchesSearch(dt, docsMap[dt.code]));
                    const filteredOpcionales   = sortDocTypes(opcionales).filter(dt => matchesSearch(dt, docsMap[dt.code]));
                    const filteredOtherDocs    = [...otherDocs]
                        .sort((a, b) => docSort === 'desc'
                            ? new Date(b.createdAt) - new Date(a.createdAt)
                            : new Date(a.createdAt) - new Date(b.createdAt))
                        .filter(d => !searchLower ||
                            d.fileName.toLowerCase().includes(searchLower) ||
                            (d.documentTypeName || '').toLowerCase().includes(searchLower));

                    const bodyClass   = docView === 'grid'
                        ? 'p-3 grid grid-cols-1 sm:grid-cols-2 gap-3'
                        : 'p-3 space-y-2';
                    const sharedProps = {
                        onUpload: handleDocUpload, onUpdateExpiry: handleUpdateExpiry,
                        onDelete: setDeleteTarget, onShare: setShareDoc,
                        onDownload: downloadDocument, onPreview: setPreviewDoc,
                        canEdit, viewMode: docView,
                    };

                    return (
                        <div className="space-y-3 max-w-2xl">
                            {/* ── Toolbar ──────────────────────────────────────── */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/40 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o tipo..."
                                        value={docSearch}
                                        onChange={e => setDocSearch(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-brand-navy/10 rounded-xl text-sm outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setDocSort(s => s === 'desc' ? 'asc' : 'desc')}
                                        className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-brand-navy/10 rounded-xl text-xs font-bold text-brand-navy/70 hover:border-brand-gold/40 hover:text-brand-navy transition-all"
                                        title={docSort === 'desc' ? 'Más reciente primero' : 'Más antiguo primero'}
                                    >
                                        {docSort === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                                        <span className="hidden sm:inline">{docSort === 'desc' ? 'Reciente' : 'Antiguo'}</span>
                                    </button>
                                    <div className="flex bg-white border border-brand-navy/10 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setDocView('list')}
                                            className={`p-2.5 transition-all ${docView === 'list' ? 'bg-brand-navy text-white' : 'text-brand-navy/50 hover:text-brand-navy'}`}
                                            title="Vista Lista"
                                        >
                                            <LayoutList size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDocView('grid')}
                                            className={`p-2.5 transition-all ${docView === 'grid' ? 'bg-brand-navy text-white' : 'text-brand-navy/50 hover:text-brand-navy'}`}
                                            title="Vista Grilla"
                                        >
                                            <LayoutGrid size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {docsLoading ? (
                                <div className="space-y-2">
                                    {[1,2,3].map(i => <div key={i} className="animate-pulse h-16 bg-white rounded-xl border border-brand-navy/5" />)}
                                </div>
                            ) : (
                                <>
                                    {/* OBLIGATORIOS */}
                                    <CollapsibleCard
                                        title={`OBLIGATORIOS — ${countComplete(obligatorios)}/${obligatorios.length} completos`}
                                        defaultOpen={true}
                                    >
                                        <div className={bodyClass}>
                                            {filteredObligatorios.length === 0 ? (
                                                <p className="text-xs text-brand-navy/40 py-4 text-center col-span-full">
                                                    {searchLower ? `Sin resultados para "${docSearch}"` : 'No hay documentos obligatorios para este tipo de carpeta'}
                                                </p>
                                            ) : filteredObligatorios.map(dt => (
                                                <DocumentCard key={dt.code} docType={dt} doc={docsMap[dt.code] || null}
                                                    isObligatorio={true} {...sharedProps} />
                                            ))}
                                        </div>
                                    </CollapsibleCard>

                                    {/* OPCIONALES Y OTROS */}
                                    <CollapsibleCard
                                        title={`OPCIONALES Y OTROS — ${countComplete(opcionales) + otherDocs.length}/${opcionales.length + otherDocs.length} adjuntos`}
                                        defaultOpen={true}
                                    >
                                        <div className={bodyClass}>
                                            {filteredOpcionales.map(dt => (
                                                <DocumentCard key={dt.code} docType={dt} doc={docsMap[dt.code] || null}
                                                    isObligatorio={false} {...sharedProps} />
                                            ))}

                                            {/* Docs sin tipo aplicable (subidos como "otro") */}
                                            {filteredOtherDocs.map(doc => (
                                                <motion.div key={doc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                    className={docView === 'grid'
                                                        ? 'bg-white rounded-xl border border-brand-navy/[0.08] shadow-sm overflow-hidden flex flex-col'
                                                        : 'bg-white rounded-xl border border-brand-navy/[0.08] shadow-sm'}>
                                                    {docView === 'grid' ? (
                                                        <>
                                                            <div className="h-28 bg-brand-slate-50 overflow-hidden">
                                                                <DocThumbnail doc={doc} />
                                                            </div>
                                                            <div className="px-3 pt-2 pb-1 flex-1 min-w-0">
                                                                <p className="text-[9px] font-bold text-brand-navy/50 tracking-widest truncate">{doc.documentTypeName || 'Otro'}</p>
                                                                <p className="text-xs font-semibold text-brand-navy truncate mt-0.5">{doc.fileName}</p>
                                                                <span className="text-[9px] text-brand-navy/40">{formatBytes(doc.fileSizeBytes)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 px-2 pb-2 pt-1 border-t border-brand-navy/5">
                                                                <button onClick={() => setPreviewDoc(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-navy/5 rounded-lg" title="Previsualizar">
                                                                    <Eye size={13} className="text-brand-navy/50" />
                                                                </button>
                                                                <button onClick={() => downloadDocument(doc.id, doc.fileName)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-navy/5 rounded-lg" title="Descargar">
                                                                    <Download size={13} className="text-brand-navy/50" />
                                                                </button>
                                                                <button onClick={() => setShareDoc(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-brand-gold/10 rounded-lg" title="Compartir">
                                                                    <Share2 size={13} className="text-brand-gold" />
                                                                </button>
                                                                {canEdit && (
                                                                    <button onClick={() => setDeleteTarget(doc)} className="flex-1 flex items-center justify-center py-1 hover:bg-red-50 rounded-lg" title="Eliminar">
                                                                        <Trash2 size={13} className="text-red-400" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-3 px-4 py-3">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                                                <Check size={14} className="text-emerald-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-brand-navy/50 tracking-widest">{doc.documentTypeName || 'Otro'}</p>
                                                                <p className="text-sm font-semibold text-brand-navy truncate">{doc.fileName}</p>
                                                                <p className="text-[10px] text-brand-navy/40">{formatBytes(doc.fileSizeBytes)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button onClick={() => setPreviewDoc(doc)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg" title="Previsualizar">
                                                                    <Eye size={14} className="text-brand-navy/60" />
                                                                </button>
                                                                <button onClick={() => downloadDocument(doc.id, doc.fileName)} className="p-1.5 hover:bg-brand-navy/5 rounded-lg" title="Descargar">
                                                                    <Download size={14} className="text-brand-navy/60" />
                                                                </button>
                                                                <button onClick={() => setShareDoc(doc)} className="p-1.5 hover:bg-brand-gold/10 rounded-lg" title="Compartir">
                                                                    <Share2 size={14} className="text-brand-gold" />
                                                                </button>
                                                                {canEdit && (
                                                                    <button onClick={() => setDeleteTarget(doc)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar">
                                                                        <Trash2 size={14} className="text-red-400" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}

                                            {filteredOpcionales.length === 0 && filteredOtherDocs.length === 0 && searchLower && (
                                                <p className="text-xs text-brand-navy/40 py-4 text-center col-span-full">Sin resultados para "{docSearch}"</p>
                                            )}

                                            {canEdit && !searchLower && (
                                                <div className={docView === 'grid' ? 'col-span-full' : ''}>
                                                    <AddOtherForm allDocTypes={docTypes} onUpload={handleDocUpload} />
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleCard>
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* ── TAB: Estado ──────────────────────────────────────────────── */}
                {activeTab === 'estado' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

                        {/* Columna izquierda: Rosca (colapsable) */}
                        <CollapsibleCard title="PROGRESO">
                            <div className="p-5 flex flex-col items-center gap-3">
                                <StatusRing currentState={form.estado} statuses={workflowStates} />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-brand-navy">{statusLabel}</p>
                                    <p className="text-[11px] text-brand-navy/50 mt-0.5">
                                        Apertura: {formatDate(carpeta.fechaApertura)}
                                        {carpeta.fechaLevante && ` · Levante: ${formatDate(carpeta.fechaLevante)}`}
                                    </p>
                                </div>
                            </div>
                        </CollapsibleCard>

                        {/* Columna derecha: Selector (colapsable) */}
                        <CollapsibleCard title="CAMBIAR ESTADO" defaultOpen={true}>
                            <div className="p-4">
                                {workflowLoading ? (
                                    <div className="animate-pulse h-20 bg-brand-navy/5 rounded-xl" />
                                ) : (
                                    <StateSelector
                                        statuses={workflowStates}
                                        currentState={form.estado}
                                        onSelect={canEdit ? setPendingState : () => {}}
                                        disabled={stateChanging || !canEdit}
                                    />
                                )}
                                {canEdit && (
                                    <p className="text-[11px] text-brand-navy/50 mt-3 leading-relaxed">
                                        Seleccioná cualquier estado para cambiar. Los estados pasados requieren confirmación adicional.
                                    </p>
                                )}
                            </div>
                        </CollapsibleCard>
                    </div>
                )}
            </div>

            {/* ── Modales ─────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {pendingState && (
                    <ConfirmModal
                        title={isGoingBack ? 'Retroceder estado' : 'Cambiar estado'}
                        message={
                            isGoingBack
                                ? `¿Retroceder el estado a "${pendingLabel}"? Los pasos intermedios quedarán sin completar.`
                                : `¿Confirmar el avance a "${pendingLabel}"?`
                        }
                        confirmLabel={stateChanging ? 'Guardando...' : 'Confirmar'}
                        danger={isGoingBack}
                        onConfirm={confirmStateChange}
                        onCancel={() => setPendingState(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {shareDoc && <ShareModal doc={shareDoc} clientEmail={fromClient?.email || null} onClose={() => setShareDoc(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <ConfirmModal
                        title="¿Eliminar documento?"
                        message={`"${deleteTarget.fileName}" de la carpeta ${carpeta.nroCarpeta}. Esta acción no se puede deshacer.`}
                        confirmLabel="Sí, eliminar"
                        danger
                        onConfirm={handleDeleteConfirmed}
                        onCancel={() => setDeleteTarget(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarpetaDetailPage;
