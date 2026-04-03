import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronDown, Building2, User, FolderOpen, Users,
    Loader2, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight,
    Phone, Mail, BriefcaseBusiness,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientById, createClient, updateClient } from '../api/clients';
import { getContactsByClient, createContact, updateContact, deleteContact } from '../api/contacts';
import { getContactTypes } from '../api/contactTypes';
import { getOperationsByClient } from '../api/operations';
import { useAppAuth } from '../contexts/AuthContext';
import CarpetaDrawer from '../components/CarpetaDrawer';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getDocValidation } from '../utils/rutValidator';

// ── Constantes de estado (carpetas) ───────────────────────────────────────────
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
const CLOSED_STATES = new Set(['CERRADO', 'FACTURADO', 'RETIRADO']);

// ── CollapsibleCard ───────────────────────────────────────────────────────────
const CollapsibleCard = ({ title, defaultOpen = true, children, className = '' }) => {
    const [open, setOpen] = useState(defaultOpen);
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

// ── FormField ─────────────────────────────────────────────────────────────────
const FormField = ({ label, value, onChange, disabled, ...props }) => (
    <div>
        <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">{label}</label>
        <input
            className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...props}
        />
    </div>
);

// ── CarpetaRow ────────────────────────────────────────────────────────────────
const CarpetaRow = ({ op, onOpen }) => {
    const statusColor = STATUS_COLORS[op.estado] || 'bg-slate-100 text-slate-500';
    const statusLabel = STATUS_LABELS[op.estado] || op.estado;
    return (
        <button
            onClick={() => onOpen(op)}
            className="w-full flex items-center gap-3 p-3 bg-brand-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-brand-navy/5 transition-all text-left group"
        >
            <FolderOpen size={14} className="text-brand-navy/30 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-navy font-mono">{op.nroCarpeta}</p>
                <p className="text-[10px] text-brand-navy/40 mt-0.5">{op.fechaApertura}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                {statusLabel}
            </span>
            <ChevronDown size={13} className="text-brand-navy/20 group-hover:text-brand-gold transition-colors shrink-0 -rotate-90" />
        </button>
    );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const ClientDetailPage = ({ clientId, isNew = false, onNavigate, onSaved }) => {
    const { hasPermission } = useAppAuth();
    const canEdit = hasPermission('BTN_EDITAR_CLIENTE');

    // ── Estado cliente ────────────────────────────────────────────────────
    const [client, setClient] = useState(null);
    const [clientLoading, setClientLoading] = useState(!isNew);
    const [clientError, setClientError] = useState(null);

    // ── Formulario ────────────────────────────────────────────────────────
    const emptyForm = {
        tipoPersona: 'EMPRESA',
        tipoDocumento: 'RUT',
        numeroDocumento: '',
        razonSocial: '',
        email: '',
        telefono: '',
        direccion: '',
        localidad: '',
        megaNumero: '',
        isActive: true,
    };
    const [form, setForm] = useState(emptyForm);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(false);

    // ── Tabs ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('general');

    // ── Contactos ─────────────────────────────────────────────────────────
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [contactTypes, setContactTypes] = useState([]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({
        nombre: '', contactTypeId: '', cargo: '', telefono: '', email: '', notas: '', receivesNotifications: false,
    });
    const [contactSaving, setContactSaving] = useState(false);
    const [contactError, setContactError] = useState(null);
    const [deleteContactTarget, setDeleteContactTarget] = useState(null);

    // ── Carpetas ──────────────────────────────────────────────────────────
    const [carpetas, setCarpetas] = useState([]);
    const [carpetasLoading, setCarpetasLoading] = useState(false);
    const [carpetaDrawerOpen, setCarpetaDrawerOpen] = useState(false);
    const [selectedCarpeta, setSelectedCarpeta] = useState(null);

    // ── Carga del cliente ─────────────────────────────────────────────────
    useEffect(() => {
        if (isNew || !clientId) return;
        let cancelled = false;
        setClientLoading(true);
        setClientError(null);
        getClientById(clientId)
            .then(data => {
                if (!cancelled) {
                    setClient(data);
                    setForm({
                        tipoPersona: data.tipoPersona || 'EMPRESA',
                        tipoDocumento: data.tipoDocumento || 'RUT',
                        numeroDocumento: data.numeroDocumento || '',
                        razonSocial: data.razonSocial || '',
                        email: data.email || '',
                        telefono: data.telefono || '',
                        direccion: data.direccion || '',
                        localidad: data.localidad || '',
                        megaNumero: data.megaNumero || '',
                        isActive: data.isActive ?? true,
                    });
                }
            })
            .catch(err => { if (!cancelled) setClientError(err.response?.data?.message || 'Error al cargar el cliente.'); })
            .finally(() => { if (!cancelled) setClientLoading(false); });
        return () => { cancelled = true; };
    }, [clientId, isNew]);

    // ── Carga contactos al abrir tab ──────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'contactos' || isNew || !clientId) return;
        let cancelled = false;
        setContactsLoading(true);
        Promise.all([getContactsByClient(clientId), getContactTypes()])
            .then(([cts, types]) => {
                if (!cancelled) {
                    setContacts(cts);
                    setContactTypes(types);
                }
            })
            .catch(() => { if (!cancelled) { setContacts([]); setContactTypes([]); } })
            .finally(() => { if (!cancelled) setContactsLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, clientId, isNew]);

    // ── Carga carpetas al abrir tab ───────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'carpetas' || isNew || !clientId) return;
        let cancelled = false;
        setCarpetasLoading(true);
        getOperationsByClient(clientId)
            .then(data => { if (!cancelled) setCarpetas(data); })
            .catch(() => { if (!cancelled) setCarpetas([]); })
            .finally(() => { if (!cancelled) setCarpetasLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, clientId, isNew]);

    // ── Auto-setear tipoDocumento según tipoPersona ───────────────────────
    const handleTipoPersonaChange = useCallback((tipo) => {
        setForm(f => ({
            ...f,
            tipoPersona: tipo,
            tipoDocumento: tipo === 'EMPRESA' ? 'RUT' : 'CI',
        }));
    }, []);

    // ── Guardar cliente ───────────────────────────────────────────────────
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormSaving(true);
        setFormError(null);
        setFormSuccess(false);

        // Validar documento antes de guardar
        const docValidation = getDocValidation(form.tipoDocumento, form.numeroDocumento);
        if (docValidation !== 'valid') {
            setFormError(`${form.tipoDocumento} inválido. Verifica el documento antes de guardar.`);
            setFormSaving(false);
            return;
        }

        try {
            const payload = {
                tipoPersona: form.tipoPersona,
                tipoDocumento: form.tipoDocumento,
                numeroDocumento: form.numeroDocumento,
                razonSocial: form.razonSocial,
                email: form.email || null,
                telefono: form.telefono || null,
                direccion: form.direccion || null,
                localidad: form.localidad || null,
                megaNumero: form.megaNumero || null,
                isActive: form.isActive,
            };
            let saved;
            if (isNew) {
                saved = await createClient(payload);
            } else {
                saved = await updateClient(clientId, payload);
                setClient(saved);
            }
            setFormSuccess(true);
            onSaved?.(saved);
            if (isNew) {
                onNavigate('clientes');
            } else {
                setTimeout(() => setFormSuccess(false), 2500);
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error al guardar el cliente.');
        } finally {
            setFormSaving(false);
        }
    };

    // ── Abrir form de contacto nuevo (para tipos adicionales sin slot) ────
    const openNewContactForm = (presetTypeId = '') => {
        setEditingContactId(null);
        setContactForm({
            nombre: '', contactTypeId: presetTypeId,
            cargo: '', telefono: '', email: '', notas: '', receivesNotifications: false,
        });
        setContactError(null);
        setShowContactForm(true);
    };

    // ── Abrir form de edición de contacto ─────────────────────────────────
    const openEditContactForm = (contact) => {
        setShowContactForm(false);
        setEditingContactId(contact.id);
        setContactForm({
            nombre: contact.nombre || '',
            contactTypeId: contact.contactTypeId ? String(contact.contactTypeId) : '',
            cargo: contact.cargo || '',
            telefono: contact.telefono || '',
            email: contact.email || '',
            notas: contact.notas || '',
            receivesNotifications: contact.receivesNotifications || false,
        });
        setContactError(null);
    };

    // ── Guardar contacto ──────────────────────────────────────────────────
    const handleContactSave = async (e) => {
        e.preventDefault();
        setContactSaving(true);
        setContactError(null);
        try {
            const payload = {
                ...contactForm,
                contactTypeId: contactForm.contactTypeId || null,
            };
            let saved;
            if (editingContactId) {
                saved = await updateContact(clientId, editingContactId, payload);
                setContacts(prev => prev.map(c => c.id === editingContactId ? saved : c));
                setEditingContactId(null);
            } else {
                saved = await createContact(clientId, payload);
                setContacts(prev => [saved, ...prev]);
                setShowContactForm(false);
            }
        } catch (err) {
            setContactError(err.response?.data?.message || 'Error al guardar el contacto.');
        } finally {
            setContactSaving(false);
        }
    };

    // ── Eliminar contacto ─────────────────────────────────────────────────
    const handleContactDelete = async () => {
        if (!deleteContactTarget) return;
        try {
            await deleteContact(clientId, deleteContactTarget.id);
            setContacts(prev => prev.filter(c => c.id !== deleteContactTarget.id));
        } catch {}
        finally { setDeleteContactTarget(null); }
    };

    // ── Validación de documento ───────────────────────────────────────────
    const docValidation = getDocValidation(form.tipoDocumento, form.numeroDocumento);

    const activeCarpetas = carpetas.filter(c => !CLOSED_STATES.has(c.estado));
    const closedCarpetas = carpetas.filter(c => CLOSED_STATES.has(c.estado));

    const clientName = isNew ? 'Nuevo Cliente' : (client?.razonSocial || '...');
    const docLabel = form.tipoDocumento === 'RUT' ? 'RUT' : 'CI';
    const razonSocialLabel = form.tipoPersona === 'EMPRESA' ? 'Razón Social' : 'Nombre Completo';
    const docHint = form.tipoDocumento === 'RUT' ? 'Ej: 214594030001 (12 dígitos sin guiones)' : 'Ej: 12345678 (7-8 dígitos sin guiones)';

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'contactos', label: 'Contactos', icon: Users },
        { id: 'carpetas', label: 'Carpetas', icon: FolderOpen },
    ];

    // ── Render loading ────────────────────────────────────────────────────
    if (clientLoading) {
        return (
            <div className="flex flex-col h-full font-sans overflow-hidden">
                <div className="px-3 md:px-8 pt-3 md:pt-5 pb-0 shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 bg-brand-navy/5 rounded-lg animate-pulse" />
                        <div className="h-7 w-48 bg-brand-navy/5 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-brand-navy/30">
                        <Loader2 size={28} className="animate-spin" />
                        <p className="text-sm font-medium">Cargando cliente...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (clientError) {
        return (
            <div className="flex flex-col h-full font-sans overflow-hidden">
                <div className="px-3 md:px-8 pt-3 md:pt-5 pb-0 shrink-0">
                    <button
                        onClick={() => onNavigate('clientes')}
                        className="p-1.5 bg-white rounded-lg border border-brand-navy/10 hover:border-brand-gold/40 transition-colors group shrink-0 mb-4"
                        title="Volver a Clientes"
                    >
                        <ChevronLeft size={15} className="text-brand-navy/50 group-hover:text-brand-gold transition-colors" />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 max-w-sm text-center">
                        <p className="text-red-600 font-bold text-sm">Error al cargar el cliente</p>
                        <p className="text-red-500 text-xs mt-1">{clientError}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full font-sans overflow-hidden">

            {/* ── Cabecera ─────────────────────────────────────────────────────── */}
            <div className="px-3 md:px-8 pt-3 md:pt-5 pb-0 shrink-0">
                {/* Breadcrumb + volver */}
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <button
                        onClick={() => onNavigate('clientes')}
                        className="p-1.5 bg-white rounded-lg border border-brand-navy/10 hover:border-brand-gold/40 transition-colors group shrink-0"
                        title="Volver a Clientes"
                    >
                        <ChevronLeft size={15} className="text-brand-navy/50 group-hover:text-brand-gold transition-colors" />
                    </button>
                    <nav className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                        <span className="text-brand-navy/40">Clientes</span>
                        <span className="text-brand-navy/20">›</span>
                        <span className="text-brand-navy/70 truncate max-w-[180px]">{clientName}</span>
                    </nav>
                </div>

                {/* Tarjeta de identidad */}
                <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm">
                    <div className="p-3 md:p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-2.5 bg-brand-navy rounded-xl shrink-0">
                                <Building2 size={16} className="text-brand-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div className="min-w-0">
                                        <h1 className="text-base md:text-lg font-display font-bold text-brand-navy truncate">
                                            {clientName}
                                        </h1>
                                        {!isNew && client && (
                                            <p className="text-xs text-brand-navy/50 mt-0.5">
                                                {client.tipoDocumento} {client.numeroDocumento}
                                                {client.megaNumero && (
                                                    <span className="ml-2 font-mono text-brand-navy/30">· Mega6: {client.megaNumero}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {!isNew && client && (
                                            <>
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-slate-50 text-brand-navy/60">
                                                    {client.tipoPersona === 'EMPRESA' ? 'Empresa' : 'Persona Física'}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                                    client.isActive !== false
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {client.isActive !== false ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </>
                                        )}
                                        {isNew && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-gold/15 text-brand-gold">
                                                Nuevo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs integrados en el borde inferior de la tarjeta */}
                    <div className="flex gap-0 border-t border-brand-navy/5 px-2">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                disabled={isNew && id !== 'general'}
                                className={`flex items-center gap-1.5 px-4 md:px-5 py-3 text-xs font-bold tracking-wider transition-all border-b-2 -mb-px disabled:opacity-30 disabled:cursor-not-allowed ${
                                    activeTab === id
                                        ? 'text-brand-navy border-brand-gold'
                                        : 'text-brand-navy/30 border-transparent hover:text-brand-navy/60 hover:border-brand-navy/10'
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Contenido scrolleable ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                    {/* ── TAB: GENERAL ──────────────────────────────────────────────── */}
                    {activeTab === 'general' && (
                        <motion.div
                            key="general"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="px-3 md:px-8 py-5 md:py-6"
                        >
                            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">

                                {/* Sección: Identificación */}
                                <CollapsibleCard title="IDENTIFICACIÓN">
                                    <div className="p-5 space-y-4">

                                        {/* Tipo de Persona */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">
                                                TIPO DE PERSONA
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { val: 'EMPRESA', label: 'Empresa', icon: Building2 },
                                                    { val: 'FISICA', label: 'Persona Física', icon: User },
                                                ].map(({ val, label, icon: Icon }) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        disabled={!canEdit && !isNew}
                                                        onClick={() => handleTipoPersonaChange(val)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                                            form.tipoPersona === val
                                                                ? 'bg-brand-navy text-white border-brand-navy shadow-lg shadow-brand-navy/20'
                                                                : 'bg-brand-slate-50 text-brand-navy/50 border-brand-navy/10 hover:border-brand-navy/30 disabled:cursor-not-allowed disabled:opacity-50'
                                                        }`}
                                                    >
                                                        <Icon size={14} />
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Número de documento */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">
                                                {docLabel}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="flex-1 bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm font-mono outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all disabled:opacity-50 disabled:cursor-default"
                                                    value={form.numeroDocumento}
                                                    onChange={e => setForm(f => ({ ...f, numeroDocumento: e.target.value }))}
                                                    disabled={!canEdit && !isNew}
                                                    placeholder={form.tipoDocumento === 'RUT' ? '214594030001' : '12345678'}
                                                    required
                                                />
                                                {docValidation === 'valid' && (
                                                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold shrink-0">
                                                        <Check size={15} className="shrink-0" />
                                                        Válido
                                                    </div>
                                                )}
                                                {docValidation === 'invalid' && (
                                                    <div className="flex items-center gap-1 text-red-500 text-xs font-bold shrink-0">
                                                        <X size={15} className="shrink-0" />
                                                        Dígito verificador incorrecto
                                                    </div>
                                                )}
                                                {docValidation === 'empty' && (
                                                    <span className="text-brand-navy/20 text-sm shrink-0">—</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-brand-navy/30 mt-1.5">{docHint}</p>
                                            <p className="text-[10px] text-brand-navy/25 mt-0.5">
                                                El dígito verificador es calculado y validado automáticamente
                                            </p>
                                        </div>

                                        {/* Razón Social */}
                                        <FormField
                                            label={razonSocialLabel.toUpperCase()}
                                            value={form.razonSocial}
                                            onChange={e => setForm(f => ({ ...f, razonSocial: e.target.value }))}
                                            disabled={!canEdit && !isNew}
                                            required
                                            placeholder={form.tipoPersona === 'EMPRESA' ? 'Nombre de la empresa S.A.' : 'Nombre y apellido'}
                                        />

                                        {/* Número Mega 6 */}
                                        <FormField
                                            label="NRO. EN MEGA 6 (OPCIONAL)"
                                            value={form.megaNumero}
                                            onChange={e => setForm(f => ({ ...f, megaNumero: e.target.value }))}
                                            disabled={!canEdit && !isNew}
                                            placeholder="Número en sistema Mega 6"
                                        />
                                    </div>
                                </CollapsibleCard>

                                {/* Sección: Contacto */}
                                <CollapsibleCard title="CONTACTO">
                                    <div className="p-5 space-y-4">
                                        <FormField
                                            label="EMAIL"
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            disabled={!canEdit && !isNew}
                                            placeholder="contacto@empresa.com"
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                label="TELÉFONO"
                                                value={form.telefono}
                                                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                                                disabled={!canEdit && !isNew}
                                                placeholder="+598 99 000 000"
                                            />
                                            <FormField
                                                label="LOCALIDAD"
                                                value={form.localidad}
                                                onChange={e => setForm(f => ({ ...f, localidad: e.target.value }))}
                                                disabled={!canEdit && !isNew}
                                                placeholder="Montevideo"
                                            />
                                        </div>
                                        <FormField
                                            label="DIRECCIÓN"
                                            value={form.direccion}
                                            onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                                            disabled={!canEdit && !isNew}
                                            placeholder="Av. 18 de Julio 1234"
                                        />
                                    </div>
                                </CollapsibleCard>

                                {/* Toggle activo/inactivo */}
                                {!isNew && (canEdit) && (
                                    <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-brand-navy">Estado del cliente</p>
                                                <p className={`text-xs font-bold mt-0.5 ${form.isActive ? 'text-emerald-600' : 'text-brand-navy/40'}`}>
                                                    {form.isActive ? 'Activo' : 'Inactivo'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                                title={form.isActive ? 'Desactivar cliente' : 'Activar cliente'}
                                                className="shrink-0"
                                            >
                                                {form.isActive
                                                    ? <ToggleRight size={34} className="text-emerald-500" />
                                                    : <ToggleLeft size={34} className="text-brand-navy/30" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {formError && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">
                                        {formError}
                                    </div>
                                )}

                                {/* Botón guardar */}
                                {(canEdit || isNew) && (
                                    <button
                                        type="submit"
                                        disabled={formSaving}
                                        className={`flex items-center justify-center gap-2 py-3 px-6 rounded-brand font-bold text-sm transition-all shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none ${
                                            formSuccess
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-brand-navy text-white'
                                        }`}
                                    >
                                        {formSaving && <Loader2 size={15} className="animate-spin text-brand-gold" />}
                                        {formSuccess
                                            ? <><Check size={15} /> Guardado</>
                                            : formSaving
                                                ? 'Guardando...'
                                                : isNew ? 'Crear Cliente' : 'Guardar Cambios'
                                        }
                                    </button>
                                )}
                            </form>
                        </motion.div>
                    )}

                    {/* ── TAB: CONTACTOS ────────────────────────────────────────────── */}
                    {activeTab === 'contactos' && (
                        <motion.div
                            key="contactos"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="px-3 md:px-8 py-5 md:py-6"
                        >
                            <div className="max-w-2xl space-y-4">

                                {/* Skeleton loading */}
                                {contactsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="animate-pulse bg-white rounded-2xl border border-brand-navy/5 p-5 flex gap-4">
                                                <div className="h-10 w-10 bg-brand-navy/5 rounded-xl shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-brand-navy/5 rounded w-24" />
                                                    <div className="h-3.5 bg-brand-navy/5 rounded w-36" />
                                                    <div className="h-3 bg-brand-navy/5 rounded w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* ── Slots por tipo de contacto ─────────────────── */}
                                        <AnimatePresence>
                                            {contactTypes.map((type, idx) => {
                                                const existing = contacts.find(
                                                    c => c.contactTypeId && String(c.contactTypeId) === String(type.id)
                                                );
                                                const isEditing = editingContactId === (existing?.id);
                                                const isOpeningNew = showContactForm &&
                                                    contactForm.contactTypeId === String(type.id) &&
                                                    !editingContactId;

                                                return (
                                                    <motion.div
                                                        key={type.id}
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.025 }}
                                                    >
                                                        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                                                            isEditing || isOpeningNew
                                                                ? 'border-brand-gold/40'
                                                                : 'border-brand-navy/5'
                                                        }`}>
                                                            {/* Cabecera del slot */}
                                                            <div className="flex items-start gap-4 p-4 md:p-5">
                                                                <div className={`p-2.5 rounded-xl shrink-0 ${existing ? 'bg-brand-gold/10' : 'bg-brand-slate-50'}`}>
                                                                    <User size={16} className={existing ? 'text-brand-gold' : 'text-brand-navy/20'} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {/* Label del tipo siempre visible */}
                                                                    <p className="text-[10px] font-bold text-brand-navy/40 tracking-widest mb-0.5">
                                                                        {type.name.toUpperCase()}
                                                                    </p>
                                                                    {existing ? (
                                                                        <>
                                                                            <p className="font-bold text-sm text-brand-navy">{existing.nombre}</p>
                                                                            {existing.cargo && (
                                                                                <p className="text-xs text-brand-navy/50 mt-0.5">{existing.cargo}</p>
                                                                            )}
                                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                                                {existing.telefono && (
                                                                                    <div className="flex items-center gap-1.5 text-xs text-brand-navy/50">
                                                                                        <Phone size={11} />{existing.telefono}
                                                                                    </div>
                                                                                )}
                                                                                {existing.email && (
                                                                                    <div className="flex items-center gap-1.5 text-xs text-brand-navy/50">
                                                                                        <Mail size={11} />{existing.email}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {existing.notas && (
                                                                                <p className="text-xs text-brand-navy/40 mt-1.5 italic">{existing.notas}</p>
                                                                            )}
                                                                            {existing.receivesNotifications && (
                                                                                <span className="inline-flex mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold">
                                                                                    Recibe notificaciones
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-xs text-brand-navy/25 italic">Sin datos</p>
                                                                    )}
                                                                </div>
                                                                {canEdit && !isOpeningNew && (
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {existing ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        isEditing
                                                                                            ? setEditingContactId(null)
                                                                                            : openEditContactForm(existing)
                                                                                    }
                                                                                    title="Editar"
                                                                                    className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors"
                                                                                >
                                                                                    <Pencil size={14} className="text-brand-navy/40 hover:text-brand-navy/70" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setDeleteContactTarget(existing)}
                                                                                    title="Eliminar"
                                                                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                                                >
                                                                                    <Trash2 size={14} className="text-brand-navy/30 hover:text-red-500" />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openNewContactForm(String(type.id))}
                                                                                title="Completar"
                                                                                className="flex items-center gap-1 text-[11px] font-bold text-brand-navy/40 hover:text-brand-gold px-2 py-1 rounded-lg hover:bg-brand-gold/5 transition-colors"
                                                                            >
                                                                                <Plus size={12} />
                                                                                Completar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Edición inline del existente */}
                                                            <AnimatePresence>
                                                                {isEditing && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.18 }}
                                                                        className="overflow-hidden border-t border-brand-navy/5"
                                                                    >
                                                                        <ContactForm
                                                                            form={contactForm}
                                                                            setForm={setContactForm}
                                                                            contactTypes={contactTypes}
                                                                            saving={contactSaving}
                                                                            error={contactError}
                                                                            onSave={handleContactSave}
                                                                            onCancel={() => setEditingContactId(null)}
                                                                        />
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            {/* Form para completar un slot vacío */}
                                                            <AnimatePresence>
                                                                {isOpeningNew && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.18 }}
                                                                        className="overflow-hidden border-t border-brand-navy/5"
                                                                    >
                                                                        <ContactForm
                                                                            form={contactForm}
                                                                            setForm={setContactForm}
                                                                            contactTypes={contactTypes}
                                                                            saving={contactSaving}
                                                                            error={contactError}
                                                                            onSave={handleContactSave}
                                                                            onCancel={() => setShowContactForm(false)}
                                                                        />
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {/* ── Contactos sin tipo (extra) ──────────────────── */}
                                        {contacts
                                            .filter(c => !c.contactTypeId || !contactTypes.find(t => String(t.id) === String(c.contactTypeId)))
                                            .map((contact, idx) => (
                                                <motion.div
                                                    key={contact.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: (contactTypes.length + idx) * 0.025 }}
                                                >
                                                    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                                                        editingContactId === contact.id ? 'border-brand-gold/40' : 'border-brand-navy/5'
                                                    }`}>
                                                        <div className="flex items-start gap-4 p-4 md:p-5">
                                                            <div className="p-2.5 bg-brand-slate-50 rounded-xl shrink-0">
                                                                <User size={16} className="text-brand-navy/40" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-brand-navy/40 tracking-widest mb-0.5">
                                                                    {contact.contactTypeName || 'OTRO'}
                                                                </p>
                                                                <p className="font-bold text-sm text-brand-navy">{contact.nombre}</p>
                                                                {contact.cargo && <p className="text-xs text-brand-navy/50 mt-0.5">{contact.cargo}</p>}
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                                    {contact.telefono && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-brand-navy/50">
                                                                            <Phone size={11} />{contact.telefono}
                                                                        </div>
                                                                    )}
                                                                    {contact.email && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-brand-navy/50">
                                                                            <Mail size={11} />{contact.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {canEdit && (
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button type="button"
                                                                        onClick={() => editingContactId === contact.id ? setEditingContactId(null) : openEditContactForm(contact)}
                                                                        title="Editar" className="p-1.5 hover:bg-brand-navy/5 rounded-lg transition-colors">
                                                                        <Pencil size={14} className="text-brand-navy/40 hover:text-brand-navy/70" />
                                                                    </button>
                                                                    <button type="button"
                                                                        onClick={() => setDeleteContactTarget(contact)}
                                                                        title="Eliminar" className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                                                        <Trash2 size={14} className="text-brand-navy/30 hover:text-red-500" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <AnimatePresence>
                                                            {editingContactId === contact.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.18 }}
                                                                    className="overflow-hidden border-t border-brand-navy/5"
                                                                >
                                                                    <ContactForm
                                                                        form={contactForm}
                                                                        setForm={setContactForm}
                                                                        contactTypes={contactTypes}
                                                                        saving={contactSaving}
                                                                        error={contactError}
                                                                        onSave={handleContactSave}
                                                                        onCancel={() => setEditingContactId(null)}
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>
                                            ))
                                        }

                                        {/* Form de nuevo contacto libre (sin tipo predefinido) */}
                                        <AnimatePresence>
                                            {showContactForm && !contactForm.contactTypeId && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 8 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="bg-white rounded-2xl border border-brand-gold/30 shadow-lg overflow-hidden"
                                                >
                                                    <div className="px-5 py-3.5 border-b border-brand-navy/5">
                                                        <p className="text-[10px] font-bold text-brand-navy/60 tracking-widest">NUEVO CONTACTO</p>
                                                    </div>
                                                    <ContactForm
                                                        form={contactForm}
                                                        setForm={setContactForm}
                                                        contactTypes={contactTypes}
                                                        saving={contactSaving}
                                                        error={contactError}
                                                        onSave={handleContactSave}
                                                        onCancel={() => setShowContactForm(false)}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Botón agregar contacto extra */}
                                        {canEdit && !showContactForm && editingContactId === null && (
                                            <button
                                                type="button"
                                                onClick={() => openNewContactForm('')}
                                                className="flex items-center gap-2 text-sm font-bold text-brand-navy/50 hover:text-brand-navy py-2 px-3 rounded-xl hover:bg-white border border-dashed border-brand-navy/15 hover:border-brand-navy/30 transition-all w-full"
                                            >
                                                <Plus size={14} className="text-brand-gold" />
                                                Agregar contacto adicional
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── TAB: CARPETAS ────────────────────────────────────────────── */}
                    {activeTab === 'carpetas' && (
                        <motion.div
                            key="carpetas"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="px-3 md:px-8 py-5 md:py-6"
                        >
                            <div className="max-w-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold text-brand-navy/40 tracking-widest">
                                        {carpetasLoading
                                            ? 'Cargando...'
                                            : `${carpetas.length} carpeta${carpetas.length !== 1 ? 's' : ''}`}
                                    </p>
                                    {hasPermission('PAGE_OPERACIONES') && (
                                        <button
                                            onClick={() => { setSelectedCarpeta(null); setCarpetaDrawerOpen(true); }}
                                            className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2 px-4 rounded-brand text-xs shadow-lg shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            <Plus size={13} className="text-brand-gold" />
                                            Nueva Carpeta
                                        </button>
                                    )}
                                </div>

                                {carpetasLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex gap-3 p-3 bg-white rounded-xl border border-brand-navy/5">
                                                <div className="h-4 w-4 bg-brand-navy/10 rounded" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="h-3 bg-brand-navy/10 rounded w-24" />
                                                    <div className="h-2.5 bg-brand-navy/5 rounded w-16" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : carpetas.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-10 flex flex-col items-center gap-3 text-brand-navy/20">
                                        <FolderOpen size={32} />
                                        <p className="text-sm font-medium">Sin carpetas registradas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {activeCarpetas.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-brand-navy/30 tracking-widest mb-2">
                                                    ACTIVAS ({activeCarpetas.length})
                                                </p>
                                                <div className="space-y-1.5">
                                                    {activeCarpetas.map(op => (
                                                        <CarpetaRow
                                                            key={op.id}
                                                            op={op}
                                                            onOpen={c => onNavigate('carpeta-detail', { carpeta: c, fromClient: client })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {closedCarpetas.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-brand-navy/30 tracking-widest mb-2">
                                                    CERRADAS ({closedCarpetas.length})
                                                </p>
                                                <div className="space-y-1.5">
                                                    {closedCarpetas.map(op => (
                                                        <CarpetaRow
                                                            key={op.id}
                                                            op={op}
                                                            onOpen={c => onNavigate('carpeta-detail', { carpeta: c, fromClient: client })}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* CarpetaDrawer */}
            <CarpetaDrawer
                operation={selectedCarpeta}
                isOpen={carpetaDrawerOpen}
                onClose={() => setCarpetaDrawerOpen(false)}
                preselectedClientId={clientId}
                onSaved={(saved) => {
                    setCarpetas(prev => {
                        const exists = prev.find(o => o.id === saved.id);
                        return exists ? prev.map(o => o.id === saved.id ? saved : o) : [saved, ...prev];
                    });
                }}
            />

            {/* ConfirmModal: eliminar contacto */}
            <ConfirmModal
                isOpen={!!deleteContactTarget}
                title="¿Eliminar contacto?"
                description={deleteContactTarget ? `Se eliminará "${deleteContactTarget.nombre}". Esta acción no se puede deshacer.` : ''}
                confirmLabel="Eliminar"
                dangerous
                onConfirm={handleContactDelete}
                onCancel={() => setDeleteContactTarget(null)}
            />
        </div>
    );
};

// ── ContactForm — formulario inline de contacto ───────────────────────────────
const ContactForm = ({ form, setForm, contactTypes, saving, error, onSave, onCancel }) => (
    <form onSubmit={onSave} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">NOMBRE *</label>
                <input
                    required
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                    placeholder="Nombre del contacto"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">TIPO DE CONTACTO</label>
                <div className="relative">
                    <select
                        value={form.contactTypeId}
                        onChange={e => setForm(f => ({ ...f, contactTypeId: e.target.value }))}
                        className="w-full appearance-none bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 pr-9 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                    >
                        <option value="">Sin tipo</option>
                        {contactTypes.map(t => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                    </select>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/40 pointer-events-none">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">CARGO</label>
                <input
                    value={form.cargo}
                    onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                    className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                    placeholder="Gerente, Contador, etc."
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">TELÉFONO</label>
                <input
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                    placeholder="+598 99 000 000"
                />
            </div>
        </div>
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">EMAIL</label>
            <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                placeholder="contacto@empresa.com"
            />
        </div>
        <div>
            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">NOTAS</label>
            <textarea
                rows={2}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                className="w-full resize-none bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                placeholder="Observaciones opcionales..."
            />
        </div>
        <div className="flex items-center justify-between py-3 px-4 bg-brand-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
                <Mail size={14} className="text-brand-navy/40" />
                <div>
                    <p className="text-xs font-bold text-brand-navy">Recibe notificaciones</p>
                    <p className="text-[10px] text-brand-navy/40 mt-0.5">Se incluye en envíos automáticos de email</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setForm(f => ({ ...f, receivesNotifications: !f.receivesNotifications }))}
                className="shrink-0"
                title="Activar/desactivar notificaciones"
            >
                {form.receivesNotifications
                    ? <ToggleRight size={30} className="text-emerald-500" />
                    : <ToggleLeft size={30} className="text-brand-navy/30" />
                }
            </button>
        </div>
        {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                {error}
            </div>
        )}
        <div className="flex items-center gap-2 justify-end">
            <button
                type="button"
                onClick={onCancel}
                className="bg-white text-brand-navy font-bold py-2.5 px-4 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2.5 px-5 rounded-brand text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
            >
                {saving && <Loader2 size={13} className="animate-spin text-brand-gold" />}
                {saving ? 'Guardando...' : 'Guardar'}
            </button>
        </div>
    </form>
);

export default ClientDetailPage;
