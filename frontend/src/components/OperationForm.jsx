import React, { useState, useEffect } from 'react';
import { createOperation } from '../api/operations';
import { getClients } from '../api/clients';
import { X, Loader2, FilePlus, ChevronRight, Upload, CheckCircle2, QrCode, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
import SearchableSelect from './ui/SearchableSelect';

const OperationForm = ({ isOpen, onClose, onOperationCreated }) => {
    const [step, setStep] = useState(1);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        tipo: 'Importación',
        nroExpediente: '',
        proveedor: '',
        valorEstimado: '',
        mercaderia: '',
        clientId: ''
    });
    const [createdOperation, setCreatedOperation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetchingClients, setIsFetchingClients] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedDocs, setUploadedDocs] = useState([]);

    useEffect(() => {
        if (isOpen && step === 1) {
            const fetchClients = async () => {
                setIsFetchingClients(true);
                try {
                    const data = await getClients();
                    setClients(data);
                    if (data.length > 0 && !formData.clientId) {
                        setFormData(prev => ({ ...prev, clientId: data[0].id }));
                    }
                } catch (err) {
                    console.error("Error al obtener clientes", err);
                } finally {
                    setTimeout(() => setIsFetchingClients(false), 500);
                }
            };
            fetchClients();
        }
    }, [isOpen, step]);

    const handleCreateOperation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const opPayload = {
                ...formData,
                clientId: formData.clientId,
                valorEstimado: formData.valorEstimado ? Number(formData.valorEstimado) : 0,
                estado: 'Incompleta',
                fecha: new Date().toISOString().split('T')[0]
            };
            const op = await createOperation(opPayload);
            setCreatedOperation(op);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrar la operación. Verifique el número de expediente.");
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles, typeCode) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const uploadFormData = new FormData();
    // IMPORTANTE: Asegúrate de que este nombre 'file' coincida 
    // con el @RequestParam("file") en tu Java
    uploadFormData.append('file', file); 
    uploadFormData.append('typeCode', typeCode.toUpperCase());

    try {
        await api.post(`/documents/upload/${createdOperation.id}`, uploadFormData, {
            headers: {
                // En lugar de escribirlo a mano, dejamos que Axios 
                // gestione el boundary, pero nos aseguramos que sepa que es FormData
                'Content-Type': 'multipart/form-data'
            }
        });
        setUploadedDocs(prev => [...prev, typeCode]);
    } catch (err) {
        console.error("Error detallado:", err.response?.data || err.message);
        setError("Error al subir el archivo.");
    }
};

    const DropZone = ({ tag, label }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: (files) => onDrop(files, tag),
            multiple: false
        });

        const isUploaded = uploadedDocs.includes(tag);

        return (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-[20px] p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[160px] ${isUploaded ? 'bg-emerald-50 border-emerald-200' :
                    isDragActive ? 'bg-brand-gold/5 border-brand-gold' : 'bg-brand-slate-50 border-brand-slate-200 hover:border-brand-gold/50'
                }`}>
                <input {...getInputProps()} aria-label={label} />
                <AnimatePresence mode="wait">
                    {isUploaded ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key="done">
                            <CheckCircle2 className="text-emerald-500" size={40} />
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="upload">
                            <Upload className="text-brand-slate-300 group-hover:text-brand-gold transition-colors" size={40} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="text-center">
                    <p className={`text-sm font-bold ${isUploaded ? 'text-emerald-700' : 'text-brand-navy'}`}>{label}</p>
                    <p className="text-[10px] text-brand-slate-500 font-bold tracking-widest mt-1">
                        {isUploaded ? 'Documento Recibido' : 'Click o arrastrar archivo'}
                    </p>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[80] flex items-center justify-center p-4 font-sans animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-brand-gold/20 flex flex-col max-h-[90vh]"
            >
                {/* Header dinámico con Progress Bar */}
                <div className="p-8 pb-4 bg-brand-navy text-white shrink-0 relative">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-gold rounded-2xl text-brand-navy shadow-lg shadow-brand-gold/20">
                                {step === 1 ? <FilePlus size={24} /> : step === 2 ? <Upload size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-bold">
                                    {step === 1 ? 'Nuevo Registro' : step === 2 ? 'Carga Documental' : 'Operación Exitosa'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`h-1.5 w-8 rounded-full transition-all ${step >= 1 ? 'bg-brand-gold' : 'bg-white/20'}`}></span>
                                    <span className={`h-1.5 w-8 rounded-full transition-all ${step >= 2 ? 'bg-brand-gold' : 'bg-white/20'}`}></span>
                                    <span className={`h-1.5 w-8 rounded-full transition-all ${step >= 3 ? 'bg-brand-gold' : 'bg-white/20'}`}></span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-8 pt-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleCreateOperation}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-brand-navy tracking-widest mb-3 block">Cliente Corporativo</label>
                                        {isFetchingClients ? (
                                            <div className="h-[54px] bg-brand-slate-50 border border-brand-slate-100 rounded-xl animate-pulse"></div>
                                        ) : (
                                            <SearchableSelect
                                                value={formData.clientId}
                                                onChange={val => setFormData({ ...formData, clientId: val })}
                                                options={clients.map(c => ({ value: c.id, label: c.razonSocial }))}
                                                placeholder="Seleccionar cliente..."
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-navy tracking-widest block">Tipo de Tráfico</label>
                                            <div className="flex bg-brand-slate-50 p-1.5 rounded-xl border border-brand-navy/5">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tipo: 'Importación' })}
                                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.tipo === 'Importación' ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-slate-400'}`}
                                                >
                                                    Importación
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tipo: 'Exportación' })}
                                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.tipo === 'Exportación' ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-slate-400'}`}
                                                >
                                                    Exportación
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-navy tracking-widest block">Referencia Oficial</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full bg-brand-slate-50 border-2 border-transparent rounded-xl py-3.5 px-5 outline-none focus:bg-white focus:border-brand-gold/50 font-mono text-sm"
                                                value={formData.nroExpediente}
                                                onChange={e => setFormData({ ...formData, nroExpediente: e.target.value })}
                                                placeholder="EXP-2024-XXXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-navy tracking-widest block">Valuación Est. (USD)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-brand-slate-50 border-2 border-transparent rounded-xl py-3.5 pl-10 pr-5 outline-none focus:bg-white focus:border-brand-gold/50 text-sm font-bold"
                                                    value={formData.valorEstimado}
                                                    onChange={e => setFormData({ ...formData, valorEstimado: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-navy tracking-widest block">Proveedor / Exportador</label>
                                            <input
                                                type="text"
                                                className="w-full bg-brand-slate-50 border-2 border-transparent rounded-xl py-3.5 px-5 outline-none focus:bg-white focus:border-brand-gold/50 text-sm"
                                                value={formData.proveedor}
                                                onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-navy text-white font-bold py-5 rounded-2xl hover:bg-brand-navy/95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-navy/30"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center gap-3">Confirmar y Continuar <ChevronRight size={18} /></div>}
                                </button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/50 flex gap-4">
                                    <ShieldCheck className="text-amber-600 shrink-0" size={24} />
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 tracking-wide">Validación Técnica Requerida</p>
                                        <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed font-medium">
                                            Para oficializar esta carpeta, el sistema requiere la Factura Comercial y el Documento de Transporte (BL/CRT).
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <DropZone tag="FACTURA" label="Factura Comercial" />
                                    <DropZone tag="TRANSPORTE" label="Doc. Transporte" />
                                </div>

                                <div className="pt-6 border-t border-brand-slate-100 flex flex-col md:flex-row gap-4">
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex-1 bg-brand-navy text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Finalizar Registro
                                        <CheckCircle2 size={20} className="text-brand-gold" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    >
                                        <CheckCircle2 size={56} />
                                    </motion.div>
                                    <div className="absolute inset-0 bg-emerald-400/20 animate-ping rounded-full -z-10"></div>
                                </div>

                                <h4 className="text-3xl font-display font-bold text-brand-navy tracking-tight">¡Expediente Registrado!</h4>
                                <p className="text-brand-slate-500 text-sm mt-4 max-w-sm mx-auto leading-relaxed">
                                    La operación <strong>{createdOperation?.nroExpediente}</strong> ha sido creada. El equipo técnico comenzará la revisión en breve.
                                </p>

                                <div className="mt-12 p-10 bg-brand-slate-50 rounded-[40px] border-2 border-brand-slate-100 inline-block relative group shadow-sm">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-brand-gold text-brand-navy text-[10px] font-black tracking-widest rounded-full shadow-lg">
                                        Tracking Mobile
                                    </div>
                                    <QRCodeSVG value={`https://lopez-vener.oec/status/${createdOperation?.nroExpediente}`} size={180} />
                                    <div className="mt-6 flex items-center justify-center gap-3 text-brand-navy py-2 px-4 bg-white rounded-xl border border-brand-navy/5 shadow-sm">
                                        <QrCode size={18} className="text-brand-gold" />
                                        <span className="font-mono font-bold text-sm">{createdOperation?.nroExpediente}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { onClose(); onOperationCreated(); }}
                                    className="w-full mt-12 py-5 text-brand-navy font-bold hover:bg-brand-slate-100 border-2 border-brand-navy/5 rounded-2xl transition-all text-sm tracking-widest"
                                >
                                    Volver al Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {error && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="p-5 bg-red-50 text-red-600 flex items-center gap-3 border-t border-red-100"
                    >
                        <AlertCircle size={18} />
                        <span className="text-[11px] font-bold tracking-tight">{error}</span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default OperationForm;
