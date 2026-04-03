import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, UserPlus, Mail, Shield, RefreshCw, AlertCircle,
    CheckCircle2, Loader2, X, ChevronDown, UserX, UserCheck, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    listInternalUsers, createInternalUser, getAssignableRoles,
    deactivateInternalUser, reactivateInternalUser, updateInternalUserRoles,
} from '../api/internalUsers';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATE_CONFIG = {
    'Activo':                 { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    'Pendiente de activación':{ bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-100'   },
    'Inactivo':               { bg: 'bg-slate-100',  text: 'text-slate-500',  border: 'border-slate-200'  },
    'Bloqueado':              { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100'  },
    'Suspendido':             { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-100' },
    'Eliminado':              { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-100'    },
};

const StateBadge = ({ state }) => {
    const cfg = STATE_CONFIG[state] ?? { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
    return (
        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {state}
        </span>
    );
};

// ── Chips de roles con add/remove ─────────────────────────────────────────────

const RoleChips = ({ userRoles, allRoles, disabled, onRolesChange }) => {
    const [adding, setAdding]   = useState(false);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState(null);
    const dropdownRef           = useRef(null);

    const available = allRoles.filter(r => !userRoles.includes(r.key));

    const handleRemove = async (roleKey) => {
        if (userRoles.length <= 1) return; // al menos un rol
        const next = userRoles.filter(r => r !== roleKey);
        setSaving(true); setError(null);
        try {
            await onRolesChange(next);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = async (roleKey) => {
        setAdding(false);
        const next = [...userRoles, roleKey];
        setSaving(true); setError(null);
        try {
            await onRolesChange(next);
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        if (!adding) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAdding(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [adding]);

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {userRoles.length === 0 ? (
                <span className="text-[11px] text-brand-navy/30 italic">Sin rol</span>
            ) : (
                userRoles.map(roleKey => (
                    <span
                        key={roleKey}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-navy/5 text-brand-navy/60 border border-brand-navy/8"
                    >
                        <Shield size={9} className="shrink-0" />
                        {roleKey}
                        {!disabled && userRoles.length > 1 && (
                            <button
                                onClick={() => handleRemove(roleKey)}
                                disabled={saving}
                                title={`Quitar ${roleKey}`}
                                className="ml-0.5 hover:text-red-500 transition-colors disabled:opacity-40"
                            >
                                <X size={9} />
                            </button>
                        )}
                    </span>
                ))
            )}

            {/* Botón agregar rol */}
            {!disabled && available.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setAdding(v => !v)}
                        disabled={saving}
                        title="Agregar rol"
                        className="inline-flex items-center justify-center w-5 h-5 rounded-md border border-dashed border-brand-navy/20 text-brand-navy/30 hover:border-brand-gold/60 hover:text-brand-gold transition-colors disabled:opacity-40"
                    >
                        {saving ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    </button>

                    <AnimatePresence>
                        {adding && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.1 }}
                                className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl border border-brand-navy/8 shadow-xl shadow-brand-navy/10 z-[50] py-1 overflow-hidden"
                            >
                                <p className="px-3 py-1.5 text-[9px] font-bold tracking-widest text-brand-navy/30">AGREGAR ROL</p>
                                {available.map(r => (
                                    <button
                                        key={r.key}
                                        onClick={() => handleAdd(r.key)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-navy/70 hover:bg-brand-gold/5 hover:text-brand-navy transition-colors"
                                    >
                                        <Shield size={12} className="text-brand-navy/30 shrink-0" />
                                        {r.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {error && (
                <span className="text-[10px] text-red-500 font-medium">{error}</span>
            )}
        </div>
    );
};

// ── Modal de confirmación de desactivación ────────────────────────────────────

const ConfirmModal = ({ user, onConfirm, onCancel, loading }) => (
    <>
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[75]"
        />
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed z-[80] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-sm bg-white rounded-2xl shadow-2xl shadow-brand-navy/20 p-6"
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
                <UserX size={22} className="text-red-500" />
            </div>
            <h2 className="text-center text-base font-bold text-brand-navy mb-1">Desactivar usuario</h2>
            <p className="text-center text-sm text-brand-navy/50 mb-6">
                <span className="font-semibold text-brand-navy">{user.displayName}</span> no podrá iniciar sesión. Sus datos y roles se conservan y podés reactivarlo luego.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl border border-brand-navy/10 text-sm font-bold text-brand-navy/60 hover:border-brand-navy/30 transition-all disabled:opacity-50">
                    Cancelar
                </button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                    Desactivar
                </button>
            </div>
        </motion.div>
    </>
);

// ── Fila de usuario ───────────────────────────────────────────────────────────

const UserRow = ({ user, allRoles, idx, onDeactivate, onReactivate, onRolesUpdated }) => {
    const isInactive = user.state === 'Inactivo';

    const handleRolesChange = async (newRoles) => {
        await updateInternalUserRoles(user.id, newRoles);
        onRolesUpdated(user.id, newRoles);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.025 }}
            className={`px-5 py-4 hover:bg-brand-gold/[0.04] transition-colors border-b border-brand-navy/[0.04] last:border-b-0 ${isInactive ? 'opacity-55' : ''}`}
        >
            <div className="flex flex-col md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 md:gap-4 items-start md:items-center">

                {/* Nombre + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-brand-navy/5 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-brand-navy/50 uppercase">
                            {user.firstName?.[0] || user.displayName?.[0] || '?'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-navy truncate">{user.displayName}</p>
                        <p className="text-[11px] text-brand-navy/40 truncate md:hidden">{user.email}</p>
                    </div>
                </div>

                {/* Email — desktop */}
                <p className="hidden md:block text-sm text-brand-navy/60 truncate">{user.email}</p>

                {/* Roles — chips editables */}
                <div className="flex items-center gap-1 flex-wrap">
                    <RoleChips
                        userRoles={user.roles ?? []}
                        allRoles={allRoles}
                        disabled={isInactive}
                        onRolesChange={handleRolesChange}
                    />
                    {/* Estado en mobile junto a los roles */}
                    <span className="md:hidden ml-1">
                        <StateBadge state={user.state} />
                    </span>
                </div>

                {/* Estado — desktop */}
                <div className="hidden md:flex">
                    <StateBadge state={user.state} />
                </div>

                {/* Acción desactivar / reactivar */}
                <div className="self-start md:self-center">
                    {isInactive ? (
                        <button
                            onClick={() => onReactivate(user)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                            <UserCheck size={12} />
                            <span className="hidden sm:inline">Reactivar</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => onDeactivate(user)}
                            title="Desactivar usuario"
                            className="p-1.5 rounded-lg text-brand-navy/20 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                            <UserX size={15} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ── Drawer de alta de usuario ─────────────────────────────────────────────────

const NewUserDrawer = ({ roles, onClose, onCreated }) => {
    const [form, setForm]     = useState({ firstName: '', lastName: '', email: '', role: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.role) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        setSaving(true); setError(null);
        try {
            const created = await createInternalUser(form);
            onCreated(created);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Error al crear el usuario.';
            setError(typeof msg === 'string' ? msg : 'Error al crear el usuario.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[65]"
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[70] flex flex-col shadow-2xl"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-brand-navy/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-navy/5 rounded-xl">
                            <UserPlus size={18} className="text-brand-navy" />
                        </div>
                        <div>
                            <p className="font-bold text-brand-navy text-sm">Nuevo usuario</p>
                            <p className="text-[11px] text-brand-navy/40">Zitadel enviará el email de activación</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
                        <X size={18} className="text-brand-navy/40" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">NOMBRE *</label>
                            <input type="text" required value={form.firstName}
                                onChange={e => set('firstName', e.target.value)} placeholder="Juan"
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">APELLIDO *</label>
                            <input type="text" required value={form.lastName}
                                onChange={e => set('lastName', e.target.value)} placeholder="Pérez"
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widest mb-1.5">EMAIL *</label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30" />
                            <input type="email" required value={form.email}
                                onChange={e => set('email', e.target.value)} placeholder="usuario@agencia.com"
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-brand-navy/50 tracking-widests mb-1.5">ROL INICIAL *</label>
                        <div className="relative">
                            <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30 pointer-events-none" />
                            <select required value={form.role} onChange={e => set('role', e.target.value)}
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 pl-10 pr-10 text-sm appearance-none outline-none focus:bg-white focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/5 transition-all">
                                <option value="" disabled>Seleccionar rol inicial...</option>
                                {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-brand-navy/40 mt-1.5">Podés agregar más roles desde la grilla después de crear el usuario.</p>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <Mail size={15} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Zitadel enviará un email de activación. No se crea ninguna contraseña local.
                        </p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="px-6 py-4 border-t border-brand-navy/5 shrink-0 flex gap-3 justify-end">
                    <button type="button" onClick={onClose}
                        className="bg-white text-brand-navy font-bold py-3 px-5 rounded-brand text-sm border border-brand-navy/10 hover:border-brand-navy/30 transition-all">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} onClick={handleSubmit}
                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3 px-5 rounded-brand text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none transition-all">
                        {saving
                            ? <><Loader2 size={15} className="animate-spin text-brand-gold" /> Creando...</>
                            : <><UserPlus size={15} className="text-brand-gold" /> Crear usuario</>
                        }
                    </button>
                </div>
            </motion.div>
        </>
    );
};

// ── Página principal ──────────────────────────────────────────────────────────

const UsersPage = () => {
    const [users, setUsers]         = useState([]);
    const [allRoles, setAllRoles]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [toast, setToast]         = useState(null);
    const [confirmUser, setConfirmUser]       = useState(null);
    const [deactivating, setDeactivating]     = useState(false);
    const [reactivatingId, setReactivatingId] = useState(null);

    const loadUsers = useCallback(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        listInternalUsers()
            .then(data => { if (!cancelled) setUsers(data); })
            .catch(err => {
                if (!cancelled) {
                    const msg = err.response?.data?.message || err.message || 'Error al cargar usuarios.';
                    setError(typeof msg === 'string' ? msg : 'Error al cargar usuarios.');
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const cancel = loadUsers();
        let rolesCancel = false;
        getAssignableRoles()
            .then(data => { if (!rolesCancel) setAllRoles(data); })
            .catch(() => { if (!rolesCancel) setAllRoles([]); });
        return () => { cancel(); rolesCancel = true; };
    }, [loadUsers]);

    const showToast = (msg, type = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4500);
    };

    const handleCreated = (user) => {
        setUsers(prev => [user, ...prev]);
        showToast(`Usuario ${user.displayName} creado. Email de activación enviado.`);
    };

    const handleRolesUpdated = (userId, newRoles) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
        showToast('Roles actualizados.');
    };

    const handleConfirmDeactivate = async () => {
        if (!confirmUser) return;
        setDeactivating(true);
        try {
            await deactivateInternalUser(confirmUser.id);
            setUsers(prev => prev.map(u => u.id === confirmUser.id ? { ...u, state: 'Inactivo' } : u));
            showToast(`${confirmUser.displayName} fue desactivado.`);
            setConfirmUser(null);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Error al desactivar.';
            showToast(typeof msg === 'string' ? msg : 'Error al desactivar.', 'error');
            setConfirmUser(null);
        } finally {
            setDeactivating(false);
        }
    };

    const handleReactivate = async (user) => {
        setReactivatingId(user.id);
        try {
            await reactivateInternalUser(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, state: 'Activo' } : u));
            showToast(`${user.displayName} fue reactivado.`);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Error al reactivar.';
            showToast(typeof msg === 'string' ? msg : 'Error al reactivar.', 'error');
        } finally {
            setReactivatingId(null);
        }
    };

    return (
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8 bg-brand-slate-50 min-h-screen">

            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-brand-navy">Gestión de Usuarios</h1>
                    <p className="text-brand-slate-500 text-sm mt-1">
                        {loading ? 'Cargando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''} en la organización`}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={loadUsers} title="Actualizar desde Zitadel"
                        className="p-2.5 bg-white border border-brand-navy/10 rounded-xl text-brand-navy/40 hover:text-brand-navy hover:border-brand-navy/30 transition-all">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowDrawer(true)}
                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-2.5 px-4 rounded-brand text-sm shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <UserPlus size={15} className="text-brand-gold" />
                        <span>Nuevo usuario</span>
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700"
                    >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">No se pudo conectar con Zitadel</p>
                            <p className="mt-0.5 font-normal opacity-80">{error}</p>
                            <p className="mt-1 text-xs opacity-70">Verificá ZITADEL_MACHINE_TOKEN, ZITADEL_ORG_ID y ZITADEL_PROJECT_ID en el .env.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden"
            >
                {/* Header de tabla — desktop */}
                <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3.5 border-b border-brand-navy/5 bg-brand-slate-50/60">
                    <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">NOMBRE</p>
                    <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">EMAIL</p>
                    <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">ROLES</p>
                    <p className="text-[10px] font-bold tracking-wide text-brand-navy/40">ESTADO</p>
                    <p className="w-8"></p>
                </div>

                {loading ? (
                    <div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse border-b border-brand-navy/[0.04] last:border-b-0">
                                <div className="h-9 w-9 rounded-full bg-brand-navy/5 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-brand-navy/5 rounded-full w-40" />
                                    <div className="h-2.5 bg-brand-navy/5 rounded-full w-56" />
                                </div>
                                <div className="hidden md:flex gap-1.5">
                                    <div className="h-5 w-16 bg-brand-navy/5 rounded-lg" />
                                    <div className="h-5 w-16 bg-brand-navy/5 rounded-lg" />
                                </div>
                                <div className="hidden md:block h-5 w-16 bg-brand-navy/5 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : users.length === 0 && !error ? (
                    <div className="flex flex-col items-center gap-3 py-16">
                        <Users size={32} className="text-brand-navy/20" />
                        <p className="text-sm font-medium text-brand-navy/50">Sin usuarios registrados</p>
                        <button onClick={() => setShowDrawer(true)}
                            className="mt-1 text-xs font-bold text-brand-gold hover:text-brand-navy transition-colors">
                            Crear el primero →
                        </button>
                    </div>
                ) : (
                    <div>
                        {users.map((user, idx) => (
                            <UserRow
                                key={user.id}
                                user={reactivatingId === user.id ? { ...user, state: 'Activo' } : user}
                                allRoles={allRoles}
                                idx={idx}
                                onDeactivate={setConfirmUser}
                                onReactivate={handleReactivate}
                                onRolesUpdated={handleRolesUpdated}
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {confirmUser && (
                    <ConfirmModal
                        user={confirmUser}
                        onConfirm={handleConfirmDeactivate}
                        onCancel={() => setConfirmUser(null)}
                        loading={deactivating}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDrawer && (
                    <NewUserDrawer roles={allRoles} onClose={() => setShowDrawer(false)} onCreated={handleCreated} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl max-w-[90vw] ${
                            toast.type === 'error'
                                ? 'bg-red-500 text-white shadow-red-500/30'
                                : 'bg-brand-navy text-white shadow-brand-navy/30'
                        }`}
                    >
                        {toast.type === 'error'
                            ? <AlertCircle size={16} className="shrink-0" />
                            : <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                        }
                        <span>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;
