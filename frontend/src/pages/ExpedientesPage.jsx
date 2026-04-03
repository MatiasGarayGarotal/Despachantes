import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOperations } from '../api/operations';
import { useAppAuth } from '../contexts/AuthContext';
import CarpetaDrawer from '../components/CarpetaDrawer';
import { OPERATION_TYPES, getOperationTypeLabel } from '../utils/operationTypes';

const STATUS_CONFIG = {
    APERTURA: { label: 'Apertura', color: 'bg-slate-100 text-slate-500' },
    DOCUMENTACION_EN_PROCESO: { label: 'Docs. en proceso', color: 'bg-blue-50 text-blue-600' },
    DOCUMENTACION_COMPLETA: { label: 'Docs. completa', color: 'bg-blue-100 text-blue-700' },
    NUMERADO: { label: 'Numerado', color: 'bg-amber-50 text-amber-600' },
    INGRESO_PUERTO: { label: 'Ingreso Puerto', color: 'bg-orange-50 text-orange-600' },
    CANAL_ASIGNADO: { label: 'Canal asignado', color: 'bg-amber-100 text-amber-700' },
    EN_DEPOSITO: { label: 'En depósito', color: 'bg-purple-50 text-purple-600' },
    LEVANTE: { label: 'Levante', color: 'bg-teal-50 text-teal-600' },
    RETIRADO: { label: 'Retirado', color: 'bg-teal-100 text-teal-700' },
    FACTURADO: { label: 'Facturado', color: 'bg-emerald-50 text-emerald-600' },
    CERRADO: { label: 'Cerrado', color: 'bg-emerald-100 text-emerald-700 font-bold' },
};
const VIA_LABELS = { MARITIMA: 'Marítima', TERRESTRE: 'Terrestre', AEREA: 'Aérea' };

const ExpedientesPage = ({ onNavigate }) => {
    const { hasPermission } = useAppAuth();
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [sort, setSort] = useState({ key: 'fechaApertura', dir: 'desc' });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { fetchOperations(); }, []);

    const fetchOperations = async () => {
        setLoading(true);
        try {
            setOperations(await getOperations());
        } catch (err) {
            console.error('Error cargando expedientes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaved = (saved) => {
        setOperations(prev => {
            const exists = prev.find(o => o.id === saved.id);
            return exists ? prev.map(o => o.id === saved.id ? saved : o) : [saved, ...prev];
        });
    };

    const openCreate = () => { setSelected(null); setDrawerOpen(true); };
    const openEdit = (op) => { onNavigate('carpeta-detail', { carpeta: op, fromClient: null }); };

    const toggleSort = (key) => setSort(prev =>
        prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return operations
            .filter(o => !filterTipo || o.tipo === filterTipo)
            .filter(o =>
                o.nroCarpeta?.toLowerCase().includes(q) ||
                o.razonSocial?.toLowerCase().includes(q) ||
                o.proveedor?.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const va = (a[sort.key] || '').toString().toLowerCase();
                const vb = (b[sort.key] || '').toString().toLowerCase();
                return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            });
    }, [operations, search, filterTipo, sort]);

    const SortIcon = ({ col }) => {
        if (sort.key !== col) return <ChevronsUpDown size={13} className="text-brand-navy/20" />;
        return sort.dir === 'asc'
            ? <ChevronUp size={13} className="text-brand-gold" />
            : <ChevronDown size={13} className="text-brand-gold" />;
    };

    const columns = [
        { key: 'nroCarpeta', label: 'Nro. Carpeta', sortable: true, className: 'w-36' },
        { key: 'razonSocial', label: 'Cliente', sortable: true, className: '' },
        { key: 'tipo', label: 'Tipo', sortable: false, className: 'hidden sm:table-cell w-28' },
        { key: 'viaTransporte', label: 'Vía', sortable: false, className: 'hidden md:table-cell w-28' },
        { key: 'estado', label: 'Estado', sortable: false, className: 'w-40' },
        { key: 'fechaApertura', label: 'Apertura', sortable: true, className: 'hidden lg:table-cell w-28' },
    ];

    return (
        <div className="p-4 md:p-10 font-sans bg-brand-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-display font-semibold text-brand-navy tracking-tight">
                        Carpetas
                    </h2>
                    <p className="text-brand-slate-500 text-sm mt-1">
                        {loading ? 'Cargando...' : `${filtered.length} carpeta${filtered.length !== 1 ? 's' : ''}`}
                    </p>
                </motion.div>

                {hasPermission('PAGE_OPERACIONES') && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-brand-navy text-white font-bold py-3.5 px-6 rounded-brand shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                    >
                        <Plus size={18} className="text-brand-gold" />
                        Nueva Carpeta
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30" />
                    <input
                        type="text"
                        placeholder="Buscar por nro. carpeta, cliente, proveedor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-brand-navy/10 rounded-xl text-sm outline-none focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all"
                    />
                </div>

                {/* Mobile: select compacto */}
                <div className="relative sm:hidden">
                    <select
                        value={filterTipo}
                        onChange={e => setFilterTipo(e.target.value)}
                        className="h-full appearance-none bg-white border border-brand-navy/10 rounded-xl py-3 pl-4 pr-9 text-sm font-bold text-brand-navy outline-none focus:border-brand-gold/50 transition-all"
                    >
                        <option value="">Todos</option>
                        <option value="IMPORTACION">Importación</option>
                        <option value="EXPORTACION">Exportación</option>
                    </select>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/40 pointer-events-none">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>

                {/* Desktop: botones chips */}
                <div className="hidden sm:flex gap-2">
                    {['', ...OPERATION_TYPES.map(t => t.value)].map(tipo => (
                        <button
                            key={tipo}
                            onClick={() => setFilterTipo(tipo)}
                            className={`px-5 py-3 rounded-xl border font-bold text-xs tracking-wider transition-all whitespace-nowrap ${
                                filterTipo === tipo
                                    ? 'bg-brand-navy text-white border-brand-navy'
                                    : 'bg-white text-brand-navy/50 border-brand-navy/10 hover:border-brand-navy/30'
                            }`}
                        >
                            {tipo === '' ? 'Todos' : tipo === '' ? 'Todos' : getOperationTypeLabel(tipo)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-slate-50/60 border-b border-brand-navy/5">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-4 text-[10px] font-bold tracking-widest text-brand-navy/40 ${col.className} ${col.sortable ? 'cursor-pointer hover:text-brand-navy/70 select-none' : ''}`}
                                    onClick={() => col.sortable && toggleSort(col.key)}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {col.label}
                                        {col.sortable && <SortIcon col={col.key} />}
                                    </span>
                                </th>
                            ))}
                            <th className="px-6 py-4 w-16" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-navy/[0.04]">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map(col => (
                                        <td key={col.key} className={`px-6 py-4 ${col.className}`}>
                                            <div className="h-3.5 bg-brand-navy/5 rounded w-24" />
                                        </td>
                                    ))}
                                    <td className="px-6 py-4" />
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <FolderOpen size={40} className="text-brand-navy/20" />
                                        <p className="text-sm font-medium text-brand-navy/50">
                                            {search ? `Sin resultados para "${search}"` : 'No hay expedientes registrados'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((op, idx) => {
                                const statusCfg = STATUS_CONFIG[op.estado] || { label: op.estado, color: 'bg-slate-100 text-slate-500' };
                                return (
                                    <motion.tr
                                        key={op.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        onClick={() => openEdit(op)}
                                        className="hover:bg-brand-gold/[0.03] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-brand-navy">{op.nroCarpeta}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-brand-navy text-sm group-hover:text-brand-gold transition-colors">
                                                {op.razonSocial}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${op.tipo === 'IMPORTACION' ? 'bg-[#E8EDF8] text-[#2E4A7D]' : 'bg-[#FDF6EE] text-[#8B6530]'}`}>
                                                {getOperationTypeLabel(op.tipo)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-brand-navy/50">{VIA_LABELS[op.viaTransporte] || op.viaTransporte}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="text-sm text-brand-navy/40">{op.fechaApertura}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-brand-navy/20 group-hover:text-brand-gold tracking-wider transition-colors">
                                                Ver →
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <CarpetaDrawer
                operation={selected}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={handleSaved}
            />
        </div>
    );
};

export default ExpedientesPage;
