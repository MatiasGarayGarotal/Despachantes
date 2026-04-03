import React, { useState, useEffect } from 'react';
import { X, FolderOpen, FileText, Upload, Trash2, Share2, Download, Eye, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClients } from '../api/clients';
import { createOperation, updateOperation, getDocumentsByOperation, uploadDocument, deleteDocument, downloadDocument, createDocumentShare, sendShareEmail } from '../api/operations';
import { getWorkflowStates } from '../api/workflowStates';
import { useAppAuth } from '../contexts/AuthContext';
import { OPERATION_TYPES } from '../utils/operationTypes';
import SearchableSelect from './ui/SearchableSelect';

// ─── Constantes ─────────────────────────────────────────────────────────────
const STATUSES = [
    { key: 'APERTURA',               label: 'Apertura' },
    { key: 'DOCUMENTACION_EN_PROCESO', label: 'Docs. proceso' },
    { key: 'DOCUMENTACION_COMPLETA', label: 'Docs. completa' },
    { key: 'NUMERADO',               label: 'Numerado' },
    { key: 'CANAL_ASIGNADO',         label: 'Canal asignado' },
    { key: 'EN_DEPOSITO',            label: 'En depósito' },
    { key: 'LEVANTE',                label: 'Levante' },
    { key: 'RETIRADO',               label: 'Retirado' },
    { key: 'FACTURADO',              label: 'Facturado' },
    { key: 'CERRADO',                label: 'Cerrado' },
];

const DOC_TYPES = [
    { code: 'FACTURA_COMERCIAL',  name: 'Factura Comercial' },
    { code: 'PACKING_LIST',       name: 'Packing List' },
    { code: 'BL',                 name: 'Bill of Lading' },
    { code: 'CRT',                name: 'CRT - Carta de Porte' },
    { code: 'MIC_DTA',            name: 'MIC/DTA' },
    { code: 'AWB',                name: 'Air Waybill' },
    { code: 'POLIZA_SEGURO',      name: 'Póliza de Seguro' },
    { code: 'CERT_ORIGEN',        name: 'Certificado de Origen' },
    { code: 'CERT_FITOSANITARIO', name: 'Cert. Fitosanitario' },
    { code: 'CERT_ZOOSANITARIO',  name: 'Cert. Zoosanitario' },
    { code: 'LICENCIA_IMP',       name: 'Licencia de Importación' },
    { code: 'ANALISIS_LAB',       name: 'Análisis de Laboratorio' },
    { code: 'CERT_CE_FDA',        name: 'Certificado CE / FDA' },
];

const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ doc, carpetaNro, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
            {/* Icono */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <Trash2 size={22} className="text-red-500" />
            </div>

            <h3 className="font-display font-bold text-brand-navy text-base mb-1">
                ¿Eliminar documento?
            </h3>
            <p className="text-sm text-brand-navy/60 mb-1">
                Estás por eliminar el archivo:
            </p>
            <p className="text-sm font-bold text-brand-navy bg-brand-slate-50 rounded-lg px-3 py-2 mb-2 truncate">
                {doc.fileName}
            </p>
            <p className="text-xs text-brand-navy/40 mb-6">
                de la carpeta <span className="font-bold text-brand-navy">{carpetaNro}</span>. Esta acción no se puede deshacer.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onCancel}
                    className="py-3 rounded-xl font-bold text-sm text-brand-navy/60 bg-brand-slate-50 hover:bg-brand-slate-100 transition-all"
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    className="py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-all"
                >
                    Sí, eliminar
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ─── ShareModal ──────────────────────────────────────────────────────────────
const ShareModal = ({ doc, onClose }) => {
    const [loading, setLoading]       = useState(false);
    const [share, setShare]           = useState(null);
    const [copied, setCopied]         = useState(false);
    const [error, setError]           = useState(null);
    const [emailTo, setEmailTo]       = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus]  = useState(null); // 'sent' | 'error'

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            setShare(await createDocumentShare(doc.id));
        } catch {
            setError('No se pudo generar el link. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(share.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        setEmailStatus(null);
        try {
            await sendShareEmail(share.token, emailTo || null);
            setEmailStatus('sent');
        } catch {
            setEmailStatus('error');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                        <p className="text-xs text-brand-navy/40 mt-0.5 truncate max-w-xs">{doc.fileName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-brand-slate-50 rounded-lg transition-colors">
                        <X size={18} className="text-brand-navy/40" />
                    </button>
                </div>

                {!share ? (
                    <>
                        <div className="bg-brand-slate-50 rounded-xl p-4 mb-5 text-sm text-brand-navy/60 space-y-1">
                            <p><span className="font-bold text-brand-navy">Tipo:</span> {doc.documentTypeName || '—'}</p>
                            <p className="text-xs text-brand-navy/40">El link generado será válido durante 7 días. Cualquier persona con el link podrá ver y descargar el documento.</p>
                        </div>
                        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
                        <button
                            onClick={generate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-brand-navy text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-navy/90 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} className="text-brand-gold" />}
                            {loading ? 'Generando...' : 'Generar link'}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Link generado */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-700">Link generado</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Válido hasta: {formatDateTime(share.expiresAt)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-brand-slate-50 border border-brand-navy/10 rounded-xl p-3 mb-4">
                            <p className="text-xs text-brand-navy/60 flex-1 truncate font-mono">{share.shareUrl}</p>
                            <button
                                onClick={copyLink}
                                className={`shrink-0 p-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-white text-brand-navy/40 hover:text-brand-navy'}`}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-5">
                            <a
                                href={share.shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 bg-white border border-brand-navy/10 text-brand-navy font-bold py-3 rounded-xl text-xs hover:border-brand-navy/30 transition-all"
                            >
                                <Eye size={14} /> Ver landing
                            </a>
                            <button
                                onClick={copyLink}
                                className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90'}`}
                            >
                                {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar link</>}
                            </button>
                        </div>

                        {/* Enviar por email */}
                        <div className="border-t border-brand-navy/5 pt-5">
                            <p className="text-xs font-bold text-brand-navy/50 mb-3">Enviar por email</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="correo@destinatario.com (o vacío para usar el del cliente)"
                                    value={emailTo}
                                    onChange={e => { setEmailTo(e.target.value); setEmailStatus(null); }}
                                    className="flex-1 bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-2.5 px-3 text-xs outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                    disabled={sendingEmail || emailStatus === 'sent'}
                                />
                                <button
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail || emailStatus === 'sent'}
                                    className={`shrink-0 flex items-center gap-1.5 font-bold py-2.5 px-4 rounded-xl text-xs transition-all ${
                                        emailStatus === 'sent'
                                            ? 'bg-emerald-500 text-white'
                                            : emailStatus === 'error'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-50'
                                    }`}
                                >
                                    {sendingEmail
                                        ? <Loader2 size={13} className="animate-spin" />
                                        : emailStatus === 'sent'
                                            ? <><Check size={13} /> Enviado</>
                                            : emailStatus === 'error'
                                                ? 'Error'
                                                : <><Download size={13} className="rotate-180" /> Enviar</>
                                    }
                                </button>
                            </div>
                            {emailStatus === 'error' && (
                                <p className="text-[11px] text-red-500 mt-2">No se pudo enviar el email. Verificá la dirección e intentá nuevamente.</p>
                            )}
                            {emailStatus === 'sent' && (
                                <p className="text-[11px] text-emerald-600 mt-2">Email enviado correctamente.</p>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

// ─── StatusStepper ───────────────────────────────────────────────────────────
const StatusStepper = ({ current, onChange }) => {
    const currentIdx = STATUSES.findIndex(s => s.key === current);
    return (
        <div className="overflow-x-auto pb-1">
            <div className="flex items-center min-w-max gap-0">
                {STATUSES.map((s, idx) => {
                    const done    = idx < currentIdx;
                    const active  = idx === currentIdx;
                    const future  = idx > currentIdx;
                    return (
                        <React.Fragment key={s.key}>
                            <button
                                onClick={() => onChange(s.key)}
                                title={s.label}
                                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all group ${future ? 'opacity-40 hover:opacity-70' : ''}`}
                            >
                                <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                                    active  ? 'bg-brand-gold border-brand-gold scale-125' :
                                    done    ? 'bg-brand-navy border-brand-navy' :
                                              'bg-white border-brand-navy/20 group-hover:border-brand-gold/60'
                                }`} />
                                <span className={`text-[9px] font-bold tracking-wide whitespace-nowrap ${
                                    active ? 'text-brand-gold' : done ? 'text-brand-navy' : 'text-brand-navy/30'
                                }`}>
                                    {s.label}
                                </span>
                            </button>
                            {idx < STATUSES.length - 1 && (
                                <div className={`h-px w-4 shrink-0 transition-colors ${done || active ? 'bg-brand-navy/30' : 'bg-brand-navy/10'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// ─── CarpetaDrawer ───────────────────────────────────────────────────────────
const CarpetaDrawer = ({ operation, isOpen, onClose, onSaved, preselectedClientId }) => {
    const { hasPermission } = useAppAuth();
    const isEditMode = !!operation;

    const emptyForm = {
        nroCarpeta: '', clientId: preselectedClientId || '', tipo: 'IMPORTACION',
        viaTransporte: 'MARITIMA', proveedor: '', descripcionMercaderia: '',
        valorEstimado: '', estado: 'APERTURA',
    };

    const [activeTab, setActiveTab]   = useState('datos');
    const [form, setForm]             = useState(emptyForm);
    const [clients, setClients]       = useState([]);
    const [documents, setDocuments]   = useState([]);
    const [loading, setLoading]       = useState(false);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState(null);
    const [success, setSuccess]       = useState(false);
    const [shareDoc, setShareDoc]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [tipoWorkflowStates, setTipoWorkflowStates] = useState({});

    // Upload state
    const [uploadFile, setUploadFile]         = useState(null);
    const [uploadTypeCode, setUploadTypeCode] = useState('FACTURA_COMERCIAL');
    const [uploading, setUploading]           = useState(false);
    const [uploadError, setUploadError]       = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setActiveTab('datos');
        setError(null);
        setSuccess(false);
        setUploadFile(null);
        setUploadError(null);
        setShareDoc(null);

        if (isEditMode) {
            setForm({
                nroCarpeta:          operation.nroCarpeta || '',
                clientId:            operation.clientId || '',
                tipo:                operation.tipo || 'IMPORTACION',
                viaTransporte:       operation.viaTransporte || 'MARITIMA',
                proveedor:           operation.proveedor || '',
                descripcionMercaderia: operation.descripcionMercaderia || '',
                valorEstimado:       operation.valorEstimado || '',
                estado:              operation.estado || 'APERTURA',
            });
            loadDocuments(operation.id);
        } else {
            setForm({ ...emptyForm, clientId: preselectedClientId || '' });
            setDocuments([]);
        }

        if (clients.length === 0) loadClients();
    }, [isOpen, operation]);

    const loadClients = async () => {
        try { setClients(await getClients()); } catch {}
    };

    const loadDocuments = async (opId) => {
        setLoading(true);
        try { setDocuments(await getDocumentsByOperation(opId)); }
        catch { setDocuments([]); }
        finally { setLoading(false); }
    };

    const loadFirstState = async (tipo) => {
        if (tipoWorkflowStates[tipo]) {
            return tipoWorkflowStates[tipo];
        }
        try {
            const states = await getWorkflowStates(tipo);
            const sorted = states.filter(s => s.isActive).sort((a, b) => a.stepOrder - b.stepOrder);
            const firstCode = sorted[0]?.code ?? 'APERTURA';
            setTipoWorkflowStates(prev => ({ ...prev, [tipo]: firstCode }));
            return firstCode;
        } catch {
            return 'APERTURA';
        }
    };

    const handleTipoChange = async (newTipo) => {
        setForm(f => ({ ...f, tipo: newTipo }));
        const firstEstado = await loadFirstState(newTipo);
        setForm(f => ({ ...f, estado: firstEstado }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                ...form,
                valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : null,
            };
            const saved = isEditMode
                ? await updateOperation(operation.id, payload)
                : await createOperation(payload);
            setSuccess(true);
            onSaved(saved);
            if (!isEditMode) {
                setTimeout(() => { onClose(); setSuccess(false); }, 800);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar la carpeta.');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!isEditMode) return;
        try {
            const saved = await updateOperation(operation.id, { estado: newStatus });
            setForm(f => ({ ...f, estado: newStatus }));
            onSaved(saved);
        } catch {}
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadError(null);
        try {
            const doc = await uploadDocument(operation.id, uploadFile, uploadTypeCode);
            setDocuments(prev => [doc, ...prev]);
            setUploadFile(null);
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Error al subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDocument(deleteTarget.id);
            setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
        } catch {}
        finally { setDeleteTarget(null); }
    };

    const handleDownload = (doc) => {
        downloadDocument(doc.id, doc.fileName);
    };

    const f = (label, key, props = {}) => (
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">{label}</label>
            <input
                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                {...props}
            />
        </div>
    );

    const sel = (label, key, options) => (
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">{label}</label>
            <select
                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[65]"
                    />
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[560px] bg-white z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-brand-navy text-white px-6 py-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-gold rounded-lg">
                                    <FolderOpen size={20} className="text-brand-navy" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-base leading-tight">
                                        {isEditMode ? operation.nroCarpeta : 'Nueva Carpeta'}
                                    </h2>
                                    <p className="text-[10px] text-brand-gold tracking-widest font-bold mt-0.5">
                                        {isEditMode ? operation.razonSocial : 'Registro de expediente'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stepper — solo en edición */}
                        {isEditMode && (
                            <div className="bg-brand-navy/[0.03] border-b border-brand-navy/5 px-6 py-3 shrink-0">
                                <StatusStepper current={form.estado} onChange={handleStatusChange} />
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex border-b border-brand-navy/5 bg-white shrink-0">
                            {[
                                { id: 'datos',      label: 'Datos',      icon: <FolderOpen size={14} /> },
                                { id: 'documentos', label: 'Documentos', icon: <FileText size={14} />, disabled: !isEditMode },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                    disabled={tab.disabled}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold tracking-widest transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'text-brand-navy border-brand-gold'
                                            : tab.disabled
                                                ? 'text-brand-navy/20 border-transparent cursor-not-allowed'
                                                : 'text-brand-navy/30 border-transparent hover:text-brand-navy/60'
                                    }`}
                                >
                                    {tab.icon}{tab.label}
                                    {tab.disabled && <span className="text-[9px] normal-case tracking-normal">(guardá primero)</span>}
                                </button>
                            ))}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 overflow-y-auto">

                            {/* Tab Datos */}
                            {activeTab === 'datos' && (
                                <form onSubmit={handleSave} className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        {f('Nro. Carpeta', 'nroCarpeta', { required: true, placeholder: '2025-IMP-0001', disabled: isEditMode })}
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">Cliente</label>
                                            <SearchableSelect
                                                value={form.clientId}
                                                onChange={val => setForm(f => ({ ...f, clientId: val }))}
                                                options={clients.map(c => ({ value: c.id, label: c.razonSocial }))}
                                                placeholder="Seleccionar cliente..."
                                                disabled={isEditMode || !!preselectedClientId}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">Tipo de operación</label>
                                            <select
                                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                                                value={form.tipo}
                                                onChange={e => handleTipoChange(e.target.value)}
                                                disabled={isEditMode}
                                            >
                                                {OPERATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        {sel('Vía de transporte', 'viaTransporte', [
                                            { value: 'MARITIMA',   label: 'Marítima' },
                                            { value: 'TERRESTRE',  label: 'Terrestre' },
                                            { value: 'AEREA',      label: 'Aérea' },
                                        ])}
                                    </div>

                                    {f('Proveedor / Exportador', 'proveedor', { placeholder: 'Empresa proveedora SA' })}

                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">Descripción de mercadería</label>
                                        <textarea
                                            className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all resize-none"
                                            rows={3}
                                            placeholder="Descripción de la mercadería..."
                                            value={form.descripcionMercaderia}
                                            onChange={e => setForm(f => ({ ...f, descripcionMercaderia: e.target.value }))}
                                        />
                                    </div>

                                    {f('Valor estimado (USD)', 'valorEstimado', { type: 'number', placeholder: '0.00', step: '0.01' })}

                                    {error && (
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-600">{error}</div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-xs tracking-widest transition-all shadow-lg ${
                                            success ? 'bg-emerald-500 text-white' : 'bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-50'
                                        }`}
                                    >
                                        {saving && <Loader2 size={16} className="animate-spin text-brand-gold" />}
                                        {success ? '✓ Guardado' : saving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear carpeta'}
                                    </button>
                                </form>
                            )}

                            {/* Tab Documentos */}
                            {activeTab === 'documentos' && isEditMode && (
                                <div className="p-6 space-y-6">
                                    {/* Upload zone */}
                                    <div className="border-2 border-dashed border-brand-navy/10 rounded-2xl p-5 space-y-4">
                                        <p className="text-[10px] font-bold text-brand-navy/40 tracking-widest text-center">Subir documento</p>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">Tipo de documento</label>
                                                <select
                                                    className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 transition-all"
                                                    value={uploadTypeCode}
                                                    onChange={e => setUploadTypeCode(e.target.value)}
                                                >
                                                    {DOC_TYPES.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                                                </select>
                                            </div>

                                            <label className={`flex items-center gap-3 cursor-pointer bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 hover:border-brand-gold/40 transition-all ${uploadFile ? 'border-brand-gold/40' : ''}`}>
                                                <Upload size={16} className="text-brand-navy/40 shrink-0" />
                                                <span className="text-sm text-brand-navy/60 truncate">
                                                    {uploadFile ? uploadFile.name : 'Seleccionar archivo...'}
                                                </span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={e => setUploadFile(e.target.files[0] || null)}
                                                />
                                            </label>
                                        </div>

                                        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

                                        <button
                                            onClick={handleUpload}
                                            disabled={!uploadFile || uploading}
                                            className="w-full flex items-center justify-center gap-2 bg-brand-navy text-white font-bold py-3 rounded-xl text-xs tracking-widest disabled:opacity-40 hover:bg-brand-navy/90 transition-all"
                                        >
                                            {uploading ? <Loader2 size={14} className="animate-spin text-brand-gold" /> : <Upload size={14} className="text-brand-gold" />}
                                            {uploading ? 'Subiendo...' : 'Subir archivo'}
                                        </button>
                                    </div>

                                    {/* Lista de documentos */}
                                    {loading ? (
                                        <div className="space-y-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="animate-pulse flex gap-3 p-4 bg-brand-slate-50 rounded-xl">
                                                    <div className="h-4 w-4 bg-brand-navy/10 rounded" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-brand-navy/10 rounded w-48" />
                                                        <div className="h-2.5 bg-brand-navy/5 rounded w-32" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-12 text-brand-navy/20">
                                            <FileText size={36} />
                                            <p className="text-sm font-medium">No hay documentos adjuntos</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {documents.map(doc => (
                                                <motion.div
                                                    key={doc.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-3 p-4 bg-brand-slate-50 rounded-xl group hover:bg-white border border-transparent hover:border-brand-navy/5 transition-all"
                                                >
                                                    <FileText size={18} className="text-brand-navy/30 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-brand-navy truncate">{doc.fileName}</p>
                                                        <p className="text-[10px] text-brand-navy/40 mt-0.5">
                                                            {doc.documentTypeName || '—'} · {formatBytes(doc.fileSizeBytes)} · {formatDate(doc.createdAt)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors"
                                                            title="Descargar"
                                                        >
                                                            <Download size={15} className="text-brand-navy/50" />
                                                        </button>
                                                        <button
                                                            onClick={() => setShareDoc(doc)}
                                                            className="p-1.5 hover:bg-brand-gold/10 rounded-lg transition-colors"
                                                            title="Compartir"
                                                        >
                                                            <Share2 size={15} className="text-brand-gold" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(doc)}
                                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={15} className="text-red-400" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Share Modal */}
                    <AnimatePresence>
                        {shareDoc && <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />}
                    </AnimatePresence>

                    {/* Confirm Delete Modal */}
                    <AnimatePresence>
                        {deleteTarget && (
                            <ConfirmDeleteModal
                                doc={deleteTarget}
                                carpetaNro={operation?.nroCarpeta || form.nroCarpeta}
                                onConfirm={handleDeleteConfirmed}
                                onCancel={() => setDeleteTarget(null)}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};

export default CarpetaDrawer;
