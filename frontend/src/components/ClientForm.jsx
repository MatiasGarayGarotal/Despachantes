import React, { useState } from 'react';
import { createClient } from '../api/clients';
import { X, Loader2, ShieldCheck } from 'lucide-react';

const ClientForm = ({ isOpen, onClose, onClientCreated }) => {
    const [formData, setFormData] = useState({
        cuit: '',
        razonSocial: '',
        email: '',
        telefono: '',
        direccion: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const newClient = await createClient(formData);
            onClientCreated(newClient);
            onClose();
            setFormData({ cuit: '', razonSocial: '', email: '', telefono: '', direccion: '' });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Error al registrar cliente institucional.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-brand shadow-2xl overflow-hidden border border-brand-gold/20 flex flex-col">
                <div className="p-8 bg-brand-navy border-b border-brand-gold/20 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-brand-gold rounded-lg text-brand-navy">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-bold">Alta de Cliente</h3>
                            <p className="text-[10px] text-brand-gold font-bold tracking-widest mt-0.5">Registro Fiscal OEC</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-brand-navy tracking-widest mb-2">CUIT / ID Tributario</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-brand-slate-50 border border-brand-slate-100 rounded-lg py-3.5 px-4 outline-none focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all font-mono"
                                value={formData.cuit}
                                onChange={e => setFormData({...formData, cuit: e.target.value})}
                                placeholder="00-00000000-0"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-brand-navy tracking-widest mb-2">Razón Social</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-brand-slate-50 border border-brand-slate-100 rounded-lg py-3.5 px-4 outline-none focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all text-sm font-bold"
                                value={formData.razonSocial}
                                onChange={e => setFormData({...formData, razonSocial: e.target.value})}
                                placeholder="Nombre de la Institución"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-navy tracking-widest mb-2">Correo Electrónico de Contacto</label>
                        <input 
                            type="email" 
                            className="w-full bg-brand-slate-50 border border-brand-slate-100 rounded-lg py-3.5 px-4 outline-none focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all text-sm"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="contacto@empresa.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-brand-navy tracking-widest mb-2">Teléfono</label>
                            <input 
                                type="text" 
                                className="w-full bg-brand-slate-50 border border-brand-slate-100 rounded-lg py-3.5 px-4 outline-none focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all text-sm"
                                value={formData.telefono}
                                onChange={e => setFormData({...formData, telefono: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-navy tracking-widest mb-2">Dirección Legal</label>
                            <input 
                                type="text" 
                                className="w-full bg-brand-slate-50 border border-brand-slate-100 rounded-lg py-3.5 px-4 outline-none focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/5 transition-all text-sm"
                                value={formData.direccion}
                                onChange={e => setFormData({...formData, direccion: e.target.value})}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex gap-3 items-start animate-bounce">
                            <span className="text-red-500">⚠</span>
                            <p className="text-red-600 text-[11px] font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-brand-slate-100 text-brand-navy font-bold py-4 rounded-brand hover:bg-brand-slate-200 transition-all text-xs tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button 
                            disabled={loading}
                            type="submit" 
                            className="flex-[2] bg-brand-navy text-white font-bold py-4 rounded-brand hover:bg-brand-navy/90 border border-brand-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-xs tracking-widest shadow-xl shadow-brand-navy/10"
                        >
                            {loading ? <Loader2 className="animate-spin text-brand-gold" size={18} /> : null}
                            {loading ? 'Procesando...' : 'Confirmar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
