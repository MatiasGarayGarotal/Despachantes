import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, Users, FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClients } from '../api/clients';
import { useAppAuth } from '../contexts/AuthContext';

// ── Componente principal ─────────────────────────────────────────────────────
const ClientesPage = ({ onNavigate }) => {
    const { hasPermission } = useAppAuth();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [sort, setSort] = useState({ key: 'razonSocial', dir: 'asc' });

    // ── Carga inicial ──────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getClients()
            .then(data => { if (!cancelled) setClients(data); })
            .catch(err => { if (!cancelled) console.error('Error cargando clientes:', err); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // ── Ordenamiento ───────────────────────────────────────────────────────
    const toggleSort = (key) => {
        setSort(prev => prev.key === key
            ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { key, dir: 'asc' }
        );
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return clients
            .filter(c => showInactive ? true : c.isActive !== false)
            .filter(c =>
                c.razonSocial?.toLowerCase().includes(q) ||
                c.numeroDocumento?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const va = (a[sort.key] || '').toLowerCase();
                const vb = (b[sort.key] || '').toLowerCase();
                return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            });
    }, [clients, search, showInactive, sort]);

    const SortIcon = ({ col }) => {
        if (sort.key !== col) return <ChevronsUpDown size={13} className="text-brand-navy/20" />;
        return sort.dir === 'asc'
            ? <ChevronUp size={13} className="text-brand-gold" />
            : <ChevronDown size={13} className="text-brand-gold" />;
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full font-sans overflow-hidden">

            {/* Cabecera y filtros */}
            <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-2xl font-display font-semibold text-brand-navy tracking-tight">
                            Clientes
                        </h2>
                        <p className="text-brand-slate-500 text-sm mt-1">
                            {loading ? 'Cargando...' : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <button
                            disabled
                            title="Disponible próximamente"
                            className="flex items-center gap-2 bg-white text-brand-navy/30 font-bold py-3 px-4 rounded-brand border border-brand-navy/10 text-sm cursor-not-allowed"
                        >
                            <FileSpreadsheet size={16} />
                            + Excel
                        </button>
                        {hasPermission('BTN_CREAR_CLIENTE') && (
                            <button
                                onClick={() => onNavigate('cliente-detail', { isNew: true })}
                                className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3 px-5 rounded-brand shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                            >
                                <Plus size={16} className="text-brand-gold" />
                                Nuevo Cliente
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30" />
                        <input
                            type="text"
                            placeholder="Buscar por razón social, documento o email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-brand-navy/10 rounded-xl text-sm outline-none focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowInactive(v => !v)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-xs tracking-wider transition-all whitespace-nowrap ${
                            showInactive
                                ? 'bg-brand-navy text-white border-brand-navy'
                                : 'bg-white text-brand-navy/50 border-brand-navy/10 hover:border-brand-navy/30'
                        }`}
                    >
                        {showInactive ? 'Activos + Inactivos' : 'Solo activos'}
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-auto px-4 md:px-8 pb-6">
                <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-slate-50/60 border-b border-brand-navy/5">
                                <th
                                    className="px-5 py-3.5 text-[10px] font-bold tracking-wide text-brand-navy/40 w-36 cursor-pointer hover:text-brand-navy/70 select-none"
                                    onClick={() => toggleSort('numeroDocumento')}
                                >
                                    <span className="flex items-center gap-1.5">Documento <SortIcon col="numeroDocumento" /></span>
                                </th>
                                <th
                                    className="px-5 py-3.5 text-[10px] font-bold tracking-wide text-brand-navy/40 cursor-pointer hover:text-brand-navy/70 select-none"
                                    onClick={() => toggleSort('razonSocial')}
                                >
                                    <span className="flex items-center gap-1.5">Razón Social <SortIcon col="razonSocial" /></span>
                                </th>
                                <th className="px-5 py-3.5 text-[10px] font-bold tracking-wide text-brand-navy/40 hidden md:table-cell">Email</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold tracking-wide text-brand-navy/40 hidden xl:table-cell">Teléfono</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold tracking-wide text-brand-navy/40 w-24 text-center">Estado</th>
                                <th className="px-5 py-3.5 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-navy/[0.04]">
                            {loading ? (
                                [1,2,3,4,5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-3.5 bg-brand-navy/5 rounded w-24" /></td>
                                        <td className="px-5 py-4"><div className="h-3.5 bg-brand-navy/5 rounded w-40" /></td>
                                        <td className="px-5 py-4 hidden md:table-cell"><div className="h-3.5 bg-brand-navy/5 rounded w-32" /></td>
                                        <td className="px-5 py-4 hidden xl:table-cell"><div className="h-3.5 bg-brand-navy/5 rounded w-20" /></td>
                                        <td className="px-5 py-4"><div className="h-5 bg-brand-navy/5 rounded-full w-14 mx-auto" /></td>
                                        <td className="px-5 py-4" />
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users size={36} className="text-brand-navy/20" />
                                            <p className="text-sm font-medium text-brand-navy/50">
                                                {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((client, idx) => (
                                <motion.tr
                                    key={client.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.025 }}
                                    onClick={() => onNavigate('cliente-detail', { clientId: client.id })}
                                    className="transition-colors cursor-pointer group hover:bg-brand-gold/[0.03]"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-sm font-bold text-brand-navy">
                                                {client.numeroDocumento}
                                            </span>
                                            {client.tipoDocumento && (
                                                <span className="text-[9px] font-bold text-brand-navy/50 bg-brand-navy/5 px-1.5 py-0.5 rounded">
                                                    {client.tipoDocumento}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-bold text-sm text-brand-navy group-hover:text-brand-gold transition-colors">
                                            {client.razonSocial}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <span className="text-sm text-brand-navy/50">{client.email || '—'}</span>
                                    </td>
                                    <td className="px-5 py-4 hidden xl:table-cell">
                                        <span className="text-sm text-brand-navy/50">{client.telefono || '—'}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                                            client.isActive !== false
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-brand-slate-100 text-brand-navy/50'
                                        }`}>
                                            {client.isActive !== false ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="text-[10px] font-bold text-brand-navy/20 group-hover:text-brand-gold tracking-wider transition-colors">
                                            Ver →
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientesPage;
