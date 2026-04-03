import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Clock, ShieldCheck, ExternalLink, Loader2, FileSearch, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';

const DossierViewer = ({ operation, isOpen, onClose }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && operation) {
            fetchDocs();
        }
    }, [isOpen, operation]);

    const fetchDocs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/documents/operation/${operation.id}`);
            setDocuments(response.data);
        } catch (err) {
            console.error("Error cargando documentos:", err);
            setError("Error al recuperar la documentación técnica.");
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleDownload = async (docId) => {
        try {
            const response = await api.get(`/documents/download/${docId}`);
            window.open(response.data.url, '_blank');
        } catch (err) {
            setError("No se pudo generar el enlace de descarga segura.");
        }
    };

    if (!isOpen || !operation) return null;

    const DocSkeleton = () => (
        <div className="h-20 bg-brand-navy/5 rounded-xl animate-pulse border border-brand-navy/5"></div>
    );

    return (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[100] flex items-center justify-end p-0 font-sans">
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-brand-gold/20"
            >
                {/* Header Premium */}
                <div className="p-8 bg-brand-navy text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-brand-gold rounded-xl text-brand-navy shadow-lg shadow-brand-gold/20">
                                    <FileSearch size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-bold tracking-tight">Expediente {operation.nroExpediente}</h3>
                                    <p className="text-[10px] text-brand-gold font-bold tracking-[0.2em] mt-1">{operation.razonSocial}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-all active:scale-90">
                            <X size={28} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10">
                    {/* Insights Rápidos */}
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="p-5 bg-brand-slate-50 rounded-2xl border border-brand-navy/5">
                            <p className="text-[10px] font-bold text-brand-slate-400 tracking-widest mb-2">Estado de Gestión</p>
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${operation.listoParaRevision ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-brand-gold shadow-[0_0_12px_rgba(180,147,78,0.5)]'}`}></span>
                                <p className="text-sm font-bold text-brand-navy tracking-tight">{operation.estado}</p>
                            </div>
                        </div>
                        <div className="p-5 bg-brand-slate-50 rounded-2xl border border-brand-navy/5">
                            <p className="text-[10px] font-bold text-brand-slate-400 tracking-widest mb-2">Apertura</p>
                            <div className="flex items-center gap-3 text-brand-navy">
                                <Clock size={16} className="text-brand-gold" />
                                <p className="text-sm font-bold">{operation.fecha}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top duration-300">
                            <AlertCircle size={20} />
                            <p className="text-xs font-bold tracking-tight">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8 border-b border-brand-slate-100 pb-4">
                        <h4 className="text-xs font-black text-brand-navy tracking-[0.2em]">Acervo Documental Técnico</h4>
                        <span className="text-[10px] font-bold bg-brand-navy text-white px-2 py-0.5 rounded-full">{documents.length}</span>
                    </div>
                    
                    {loading ? (
                        <div className="space-y-4">
                            <DocSkeleton />
                            <DocSkeleton />
                            <DocSkeleton />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-24 bg-brand-slate-50/50 rounded-[32px] border-2 border-dashed border-brand-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <FileText size={28} className="text-brand-slate-200" />
                            </div>
                            <p className="text-sm text-brand-slate-400 font-medium italic">Sin documentación adjunta.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {documents.map((doc, idx) => (
                                    <motion.div 
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group p-5 bg-white border border-brand-slate-100 rounded-2xl hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-navy/5 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-brand-slate-50 flex items-center justify-center rounded-xl text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-brand-navy truncate max-w-[240px] tracking-tight">{doc.fileName}</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[9px] font-black bg-brand-gold/20 text-brand-navy px-2 py-0.5 rounded tracking-widest">{doc.type?.name || 'Varios'}</span>
                                                    <span className="text-[9px] text-brand-slate-400 flex items-center gap-1 font-bold italic"><Clock size={10} /> {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDownload(doc.id)}
                                            className="h-12 w-12 flex items-center justify-center bg-brand-slate-50 text-brand-navy rounded-xl hover:bg-brand-gold hover:text-white transition-all shadow-inner active:scale-90"
                                            title="Descarga Segura"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Timeline de Trazabilidad */}
                    <div className="mt-16">
                         <h4 className="text-xs font-black text-brand-navy tracking-[0.2em] mb-8">Línea de Vida del Expediente</h4>
                         <div className="space-y-8 pl-4 border-l-2 border-brand-slate-100">
                             <div className="relative">
                                 <div className="absolute -left-[27px] top-0 w-5 h-5 bg-brand-gold rounded-full border-4 border-white shadow-sm ring-4 ring-brand-gold/10"></div>
                                 <div className="bg-brand-slate-50 p-5 rounded-2xl border border-brand-navy/5">
                                     <p className="text-xs font-black text-brand-navy tracking-tight">Expediente {operation.nroExpediente}</p>
                                     <p className="text-[11px] text-brand-slate-500 mt-1 leading-relaxed">Registro inicial y alta en sistema por equipo técnico.</p>
                                     <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-navy/5">
                                         <span className="text-[10px] text-brand-slate-400 font-bold italic">{operation.fecha}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="p-10 bg-brand-slate-50 border-t border-brand-slate-100 shrink-0">
                    <button 
                        className="w-full bg-brand-navy text-white font-bold py-5 rounded-2xl hover:bg-brand-navy/95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-navy/20 group"
                    >
                        Oficializar Carpeta Electrónica
                        <ExternalLink size={20} className="text-brand-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DossierViewer;
