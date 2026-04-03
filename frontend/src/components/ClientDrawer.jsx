import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Building2, FileText, ToggleLeft, ToggleRight, FolderOpen, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient, updateClient } from '../api/clients';
import { getOperationsByClient } from '../api/operations';
import { useAppAuth } from '../contexts/AuthContext';
import CarpetaDrawer from './CarpetaDrawer';

/**
 * Drawer deslizable para crear o editar un cliente.
 *
 * Props:
 *   client     → null = modo crear | objeto = modo editar
 *   isOpen     → boolean
 *   onClose    → fn
 *   onSaved    → fn(savedClient) — se llama tras guardar exitosamente
 */
const STATUS_COLORS = {
    APERTURA: 'bg-slate-100 text-slate-500',
    DOCUMENTACION_EN_PROCESO: 'bg-blue-50 text-blue-600',
    DOCUMENTACION_COMPLETA: 'bg-blue-100 text-blue-700',
    NUMERADO: 'bg-amber-50 text-amber-600',
    CANAL_ASIGNADO: 'bg-amber-100 text-amber-700',
    EN_DEPOSITO: 'bg-purple-50 text-purple-600',
    LEVANTE: 'bg-teal-50 text-teal-600',
    RETIRADO: 'bg-teal-100 text-teal-700',
    FACTURADO: 'bg-emerald-50 text-emerald-600',
    CERRADO: 'bg-emerald-100 text-emerald-700',
};
const STATUS_LABELS = {
    APERTURA: 'Apertura', DOCUMENTACION_EN_PROCESO: 'Docs. proceso',
    DOCUMENTACION_COMPLETA: 'Docs. completa', NUMERADO: 'Numerado',
    CANAL_ASIGNADO: 'Canal asignado', EN_DEPOSITO: 'En depósito',
    LEVANTE: 'Levante', RETIRADO: 'Retirado', FACTURADO: 'Facturado', CERRADO: 'Cerrado',
};

const ClientDrawer = ({ client, isOpen, onClose, onSaved }) => {
    const { hasPermission } = useAppAuth();
    const isEditMode = client !== null && client !== undefined;
    const canEdit = isEditMode ? hasPermission('BTN_EDITAR_CLIENTE') : hasPermission('BTN_CREAR_CLIENTE');

    const emptyForm = { rut: '', razonSocial: '', email: '', telefono: '', direccion: '', isActive: true };

    const [form, setForm] = useState(emptyForm);
    const [activeTab, setActiveTab] = useState('datos');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [carpetas, setCarpetas]           = useState([]);
    const [carpetasLoading, setCarpetasLoading] = useState(false);
    const [carpetaDrawerOpen, setCarpetaDrawerOpen] = useState(false);
    const [selectedCarpeta, setSelectedCarpeta]     = useState(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('datos');
            setError(null);
            setSuccess(false);
            setCarpetas([]);
            setForm(client
                ? { rut: client.rut || '', razonSocial: client.razonSocial || '', email: client.email || '', telefono: client.telefono || '', direccion: client.direccion || '', isActive: client.isActive ?? true }
                : emptyForm
            );
        }
    }, [isOpen, client]);

    useEffect(() => {
        if (activeTab === 'carpetas' && client?.id) {
            setCarpetasLoading(true);
            getOperationsByClient(client.id)
                .then(setCarpetas)
                .catch(() => setCarpetas([]))
                .finally(() => setCarpetasLoading(false));
        }
    }, [activeTab, client]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const saved = isEditMode
                ? await updateClient(client.id, form)
                : await createClient(form);
            setSuccess(true);
            onSaved(saved);
            if (!isEditMode) {
                setTimeout(() => { onClose(); setSuccess(false); }, 900);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el cliente.');
        } finally {
            setLoading(false);
        }
    };

    const field = (label, key, props = {}) => (
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">{label}</label>
            <input
                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                disabled={!canEdit}
                {...props}
            />
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay — z-[65] para quedar sobre el sidebar (z-[55]) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[65]"
                    />

                    {/* Panel — z-[70] sobre el overlay */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-brand-navy text-white px-6 py-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-gold rounded-lg">
                                    <Building2 size={20} className="text-brand-navy" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-base leading-tight">
                                        {isEditMode ? client.razonSocial : 'Nuevo Cliente'}
                                    </h2>
                                    <p className="text-[10px] text-brand-gold tracking-widest font-bold mt-0.5">
                                        {isEditMode ? `RUT ${client.rut}` : 'Registro de cliente'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-brand-navy/5 bg-white shrink-0">
                            {[
                                { id: 'datos', label: 'Datos', icon: <Building2 size={14} /> },
                                { id: 'carpetas', label: 'Carpetas', icon: <FolderOpen size={14} />, disabled: !isEditMode },
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
                                </button>
                            ))}
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'datos' && (
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            {field('RUT', 'rut', { required: true, placeholder: '21234567', disabled: isEditMode || !canEdit })}
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            {field('Razón Social', 'razonSocial', { required: true, placeholder: 'Empresa SA' })}
                                        </div>
                                    </div>
                                    {field('Email de contacto', 'email', { type: 'email', placeholder: 'contacto@empresa.com' })}
                                    <div className="grid grid-cols-2 gap-4">
                                        {field('Teléfono', 'telefono', { placeholder: '+598 99 000 000' })}
                                        {field('Dirección', 'direccion', { placeholder: 'Av. 18 de Julio 1234' })}
                                    </div>

                                    {/* Toggle activo — solo en edición */}
                                    {isEditMode && canEdit && (
                                        <div className="flex items-center justify-between py-3 px-4 bg-brand-slate-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-brand-navy">Estado del cliente</p>
                                                <p className="text-xs text-brand-navy/40 mt-0.5">{form.isActive ? 'Activo — aparece en el listado' : 'Inactivo — oculto por defecto'}</p>
                                            </div>
                                            <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                                                {form.isActive
                                                    ? <ToggleRight size={36} className="text-emerald-500" />
                                                    : <ToggleLeft size={36} className="text-brand-navy/20" />
                                                }
                                            </button>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-600 font-medium">
                                            {error}
                                        </div>
                                    )}

                                    {canEdit && (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-xs tracking-widest transition-all shadow-lg ${
                                                success
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-brand-navy text-white hover:bg-brand-navy/90 disabled:opacity-50'
                                            }`}
                                        >
                                            {loading && <Loader2 size={16} className="animate-spin text-brand-gold" />}
                                            {success ? '✓ Guardado' : loading ? 'Guardando...' : (
                                                <><Save size={16} />{isEditMode ? 'Guardar cambios' : 'Registrar cliente'}</>
                                            )}
                                        </button>
                                    )}
                                </form>
                            )}

                            {activeTab === 'carpetas' && (
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-brand-navy/40 tracking-widest">
                                            {carpetasLoading ? 'Cargando...' : `${carpetas.length} carpeta${carpetas.length !== 1 ? 's' : ''}`}
                                        </p>
                                        {hasPermission('PAGE_OPERACIONES') && (
                                            <button
                                                onClick={() => { setSelectedCarpeta(null); setCarpetaDrawerOpen(true); }}
                                                className="flex items-center gap-1.5 bg-brand-navy text-white text-xs font-bold py-2 px-3.5 rounded-lg hover:bg-brand-navy/90 transition-all"
                                            >
                                                <Plus size={13} className="text-brand-gold" /> Nueva carpeta
                                            </button>
                                        )}
                                    </div>

                                    {carpetasLoading ? (
                                        <div className="space-y-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="animate-pulse flex gap-3 p-4 bg-brand-slate-50 rounded-xl">
                                                    <div className="h-4 w-4 bg-brand-navy/10 rounded" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-brand-navy/10 rounded w-32" />
                                                        <div className="h-2.5 bg-brand-navy/5 rounded w-20" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : carpetas.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-12 text-brand-navy/20">
                                            <FolderOpen size={36} />
                                            <p className="text-sm font-medium">No hay carpetas registradas</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {carpetas.map(op => {
                                                const statusColor = STATUS_COLORS[op.estado] || 'bg-slate-100 text-slate-500';
                                                const statusLabel = STATUS_LABELS[op.estado] || op.estado;
                                                return (
                                                    <button
                                                        key={op.id}
                                                        onClick={() => { setSelectedCarpeta(op); setCarpetaDrawerOpen(true); }}
                                                        className="w-full flex items-center gap-3 p-4 bg-brand-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-brand-navy/5 transition-all text-left group"
                                                    >
                                                        <FolderOpen size={16} className="text-brand-navy/30 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-brand-navy font-mono">{op.nroCarpeta}</p>
                                                            <p className="text-[10px] text-brand-navy/40 mt-0.5">{op.fechaApertura}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                                            {statusLabel}
                                                        </span>
                                                        <ChevronRight size={14} className="text-brand-navy/20 group-hover:text-brand-gold transition-colors shrink-0" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}

            <CarpetaDrawer
                operation={selectedCarpeta}
                isOpen={carpetaDrawerOpen}
                onClose={() => setCarpetaDrawerOpen(false)}
                preselectedClientId={client?.id}
                onSaved={(saved) => {
                    setCarpetas(prev => {
                        const exists = prev.find(o => o.id === saved.id);
                        return exists ? prev.map(o => o.id === saved.id ? saved : o) : [saved, ...prev];
                    });
                }}
            />
        </AnimatePresence>
    );
};

export default ClientDrawer;
