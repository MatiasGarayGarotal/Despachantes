import React, { useState, useEffect } from 'react';
import { Plus, Users, FileCheck, AlertCircle, Clock, ExternalLink, Mail, CheckCircle2, Circle, Search, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';

import { getClients } from '../api/clients';
import { getOperations } from '../api/operations';
import { motion, AnimatePresence } from 'framer-motion';
import ClientForm from '../components/ClientForm';
import OperationForm from '../components/OperationForm';
import DossierViewer from '../components/DossierViewer';

const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [clients, setClients] = useState([]);
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState(null);
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'clients'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientsData, opsData] = await Promise.all([getClients(), getOperations()]);
            setClients(clientsData);
            setOperations(opsData);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setTimeout(() => setLoading(false), 600); // Suavizado para evitar flash
        }
    };

    const filteredOperations = operations.filter(op => 
        (op.nroExpediente && op.nroExpediente.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (op.razonSocial && op.razonSocial.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (op.proveedor && op.proveedor.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleViewOperation = (op) => {
        setSelectedOperation(op);
        setIsDossierOpen(true);
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-8 py-6"><div className="h-4 bg-brand-navy/5 rounded w-3/4"></div></td>
            <td className="px-8 py-6"><div className="h-4 bg-brand-navy/5 rounded w-1/2"></div></td>
            <td className="px-8 py-6"><div className="h-4 bg-brand-navy/5 rounded w-1/4"></div></td>
            <td className="px-8 py-6"><div className="h-8 bg-brand-navy/5 rounded-lg w-20"></div></td>
        </tr>
    );

    return (
        <div className="p-4 md:p-10 font-sans bg-brand-slate-50 min-h-screen">
            {/* Buscador global */}
            <div className="mb-8 relative group">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/30 group-focus-within:text-brand-gold transition-colors" />
                <input
                    type="text"
                    placeholder="Buscar carpeta, cliente..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-brand-navy/10 rounded-2xl py-4 pl-12 pr-5 text-sm text-brand-navy focus:bg-white focus:border-brand-gold/40 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none placeholder:text-brand-navy/30 shadow-sm"
                />
            </div>

            {/* Header con Jerarquía Visual */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-2xl font-display font-semibold text-brand-navy tracking-tight">
                        Resumen Operativo
                    </h2>
                    <p className="text-brand-slate-500 font-medium mt-2 flex items-center gap-2">
                        <Clock size={16} className="text-brand-gold" />
                        Última actualización: {new Date().toLocaleTimeString()}
                    </p>
                </motion.div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsClientModalOpen(true)}
                        title="Registrar un nuevo cliente en el sistema"
                        className="flex-1 md:flex-none border-2 border-brand-navy/10 text-brand-navy font-bold py-3.5 px-6 rounded-brand hover:bg-brand-navy hover:text-white transition-all duration-300 flex items-center justify-center gap-2 min-h-[46px]"
                    >
                        <Users size={18} />
                        + Cliente
                    </button>
                    <button
                        onClick={() => setIsOperationModalOpen(true)}
                        title="Abrir una nueva carpeta de operación aduanera"
                        className="flex-1 md:flex-none bg-brand-navy text-white font-bold py-3.5 px-8 rounded-brand shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[46px]"
                    >
                        <Plus size={20} className="text-brand-gold" />
                        + Carpeta
                    </button>
                </div>
            </div>

            {/* KPIs con refinamiento Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {operations.length === 0 && loading ? (
                    [1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-brand border border-brand-navy/5 animate-pulse"></div>)
                ) : (
                    <>
                        <div className="bg-white p-6 rounded-brand shadow-sm border border-brand-navy/5 hover:border-brand-gold/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-gold/10 rounded-xl text-brand-navy group-hover:scale-110 transition-transform">
                                    <ListIcon size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-brand-slate-400 tracking-widest">Total Anual</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-brand-navy">{operations.length}</p>
                            <p className="text-xs text-brand-slate-500 mt-1">Carpetas gestionadas</p>
                        </div>
                        <div className="bg-white p-6 rounded-brand shadow-sm border border-brand-navy/5 hover:border-emerald-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                                    <FileCheck size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-brand-slate-400 tracking-widest">Para Revisión</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-brand-navy">{operations.filter(op => op.listoParaRevision).length}</p>
                            <p className="text-xs text-brand-slate-500 mt-1 font-bold text-emerald-600">Prioridad Despachante</p>
                        </div>
                        <div className="bg-white p-6 rounded-brand shadow-sm border border-brand-navy/5 hover:border-brand-gold transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                    <Clock size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-brand-slate-400 tracking-widest">Incompletas</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-brand-navy">{operations.filter(op => !op.listoParaRevision && op.estado === 'Incompleta').length}</p>
                            <p className="text-xs text-brand-slate-500 mt-1 italic whitespace-nowrap">Pendiente de cliente</p>
                        </div>
                        <div className="bg-white p-6 rounded-brand shadow-sm border border-brand-navy/5 hover:border-red-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
                                    <AlertCircle size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-brand-slate-400 tracking-widest">Aviso de Plazo</span>
                            </div>
                            <p className="text-3xl font-display font-bold text-brand-navy">3</p>
                            <p className="text-xs text-brand-slate-500 mt-1">Requieren atención</p>
                        </div>
                    </>
                )}
            </div>

            {/* Contenedor Principal (Inbox/Clientes) */}
            <div className="bg-white rounded-[24px] shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden">
                <div className="border-b border-brand-navy/5 px-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <nav className="flex gap-10" role="tablist">
                        <button 
                            onClick={() => setActiveTab('inbox')}
                            className={`pb-4 text-xs font-bold tracking-[0.2em] transition-all relative ${activeTab === 'inbox' ? 'text-brand-navy' : 'text-brand-slate-400 hover:text-brand-navy'}`}
                            role="tab"
                            aria-selected={activeTab === 'inbox'}
                        >
                            Bandeja de Entrada
                            {activeTab === 'inbox' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-gold" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('clients')}
                            className={`pb-4 text-xs font-bold tracking-[0.2em] transition-all relative ${activeTab === 'clients' ? 'text-brand-navy' : 'text-brand-slate-400 hover:text-brand-navy'}`}
                            role="tab"
                            aria-selected={activeTab === 'clients'}
                        >
                            Directorio de Clientes
                            {activeTab === 'clients' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-gold" />}
                        </button>
                    </nav>
                </div>

                <div className="p-0 md:p-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'inbox' ? (
                            <motion.div 
                                key="inbox"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="overflow-x-auto"
                            >
                                <table className="hidden md:table w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-brand-slate-50/50">
                                            <th className="px-8 py-5 text-brand-navy/60 font-display font-bold tracking-wider text-[10px]">Expediente Técnica</th>
                                            <th className="px-8 py-5 text-brand-navy/60 font-display font-bold tracking-wider text-[10px]">Gestión / Cliente</th>
                                            <th className="px-8 py-5 text-brand-navy/60 font-display font-bold tracking-wider text-[10px]">Estatutos Doc.</th>
                                            <th className="px-8 py-5 text-brand-navy/60 font-display font-bold tracking-wider text-[10px] text-right">Aciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-slate-50">
                                        {loading ? (
                                            [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                                        ) : filteredOperations.length === 0 ? (
                                            <tr><td colSpan="4" className="px-8 py-32 text-center text-brand-slate-300">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Search size={48} className="text-brand-slate-200" />
                                                    <p className="text-sm font-medium italic">No se encontraron expedientes con "{searchQuery}"</p>
                                                </div>
                                            </td></tr>
                                        ) : (
                                            filteredOperations.map((op, idx) => (
                                                <motion.tr 
                                                    key={op.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-brand-navy/[0.02] transition-colors group"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono font-bold text-brand-navy text-base">{op.nroExpediente}</span>
                                                            <span className="text-[10px] font-bold text-brand-gold tracking-tighter mt-1">{op.tipo}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="font-bold text-brand-navy tracking-tight">{op.razonSocial}</p>
                                                        <p className="text-xs text-brand-slate-400 mt-1 font-medium italic">Proveedor: {op.proveedor || 'No especificado'}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-1">
                                                                <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${op.tieneFactura ? 'bg-emerald-500 text-white' : 'bg-brand-slate-100 text-brand-slate-400'}`}>
                                                                    <FileCheck size={14} />
                                                                </div>
                                                                <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${op.tieneTransporte ? 'bg-emerald-500 text-white' : 'bg-brand-slate-100 text-brand-slate-400'}`}>
                                                                    <FileCheck size={14} />
                                                                </div>
                                                            </div>
                                                            {op.listoParaRevision && (
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-100 pulse shadow-sm">REVISIÓN</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                onClick={() => handleViewOperation(op)}
                                                                className="h-[44px] w-[44px] flex items-center justify-center bg-white border border-brand-navy/10 text-brand-navy rounded-xl hover:bg-brand-navy hover:text-white transition-all shadow-sm"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </button>
                                                            {!op.listoParaRevision && (
                                                                <button className="h-[44px] w-[44px] flex items-center justify-center bg-brand-navy text-white rounded-xl hover:opacity-90 transition-all shadow-md">
                                                                    <Mail size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Mobile View (Cards) */}
                                <div className="md:hidden space-y-4 p-4">
                                    {loading ? (
                                        [1,2,3].map(i => <div key={i} className="h-40 bg-brand-navy/5 rounded-brand animate-pulse"></div>)
                                    ) : filteredOperations.map(op => (
                                        <div key={op.id} className="bg-white p-6 rounded-brand border border-brand-navy/5 shadow-sm active:scale-95 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-mono font-bold text-brand-navy">{op.nroExpediente}</p>
                                                    <p className="text-[10px] font-bold text-brand-gold">{op.tipo}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${op.tieneFactura ? 'bg-emerald-500 text-white' : 'bg-brand-slate-100 text-brand-slate-400'}`}>
                                                        <FileCheck size={12} />
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${op.tieneTransporte ? 'bg-emerald-500 text-white' : 'bg-brand-slate-100 text-brand-slate-400'}`}>
                                                        <FileCheck size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-bold text-brand-navy">{op.razonSocial}</p>
                                            <div className="mt-4 flex gap-3">
                                                <button onClick={() => handleViewOperation(op)} className="flex-1 bg-brand-navy text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                                                    <ExternalLink size={16} /> Ver
                                                </button>
                                                {!op.listoParaRevision && (
                                                    <button className="flex-1 bg-brand-slate-100 text-brand-navy py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]">
                                                        <Mail size={16} /> Reclamar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="clients"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="p-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {clients.map(c => (
                                        <div key={c.id} className="bg-white p-6 rounded-brand border border-brand-navy/5 shadow-sm flex items-center justify-between group hover:border-brand-gold/50 transition-all">
                                            <div>
                                                <p className="font-bold text-brand-navy text-lg">{c.razonSocial}</p>
                                                <p className="text-xs text-brand-slate-400 mt-1 font-mono">{c.cuit}</p>
                                                <span className="inline-flex items-center gap-2 text-[9px] font-bold text-emerald-600 mt-4 bg-emerald-50 px-2 py-1 rounded">
                                                    <Circle size={6} fill="currentColor" /> Cliente Activo
                                                </span>
                                            </div>
                                            <button className="p-3 bg-brand-slate-50 text-brand-navy rounded-xl group-hover:bg-brand-navy group-hover:text-white transition-all shadow-inner">
                                                <Users size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <ClientForm isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onClientCreated={fetchData} />
            <OperationForm isOpen={isOperationModalOpen} onClose={() => setIsOperationModalOpen(false)} onOperationCreated={fetchData} />
            
            <DossierViewer 
                operation={selectedOperation}
                isOpen={isDossierOpen}
                onClose={() => setIsDossierOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
