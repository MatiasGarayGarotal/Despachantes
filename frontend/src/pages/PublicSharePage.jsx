import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Clock, AlertTriangle, Loader2, FolderOpen, User, Calendar } from 'lucide-react';
import { getShareInfo, getShareFileUrl } from '../api/operations';
import logo from '../assets/Logo1.jpeg';

const formatDateTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-UY', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const isExpired = (iso) => iso && new Date(iso) < new Date();

const PublicSharePage = ({ token }) => {
    const [info, setInfo]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setInfo(await getShareInfo(token));
            } catch (err) {
                const msg = err.response?.data?.message || '';
                setError(msg.toLowerCase().includes('expir') || msg.toLowerCase().includes('venc')
                    ? 'expired'
                    : 'not_found');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    const expired = info && isExpired(info.expiresAt);

    return (
        <div className="min-h-screen bg-brand-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            {/* Branding */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-brand-navy/10">
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                    <p className="font-display font-bold text-brand-navy text-base tracking-tight">LÓPEZ VENER</p>
                    <p className="text-[10px] text-brand-gold font-bold tracking-[0.2em]">Despachante OEC</p>
                </div>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-brand-navy/8 border border-brand-navy/5 overflow-hidden">

                {loading && (
                    <div className="p-12 flex flex-col items-center gap-3 text-brand-navy/40">
                        <Loader2 size={32} className="animate-spin text-brand-gold" />
                        <p className="text-sm">Verificando link...</p>
                    </div>
                )}

                {!loading && (error === 'not_found') && (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-400" />
                        </div>
                        <div>
                            <p className="font-display font-bold text-brand-navy text-lg">Link no encontrado</p>
                            <p className="text-sm text-brand-navy/40 mt-1">Este link no existe o fue eliminado.</p>
                        </div>
                    </div>
                )}

                {!loading && (error === 'expired' || expired) && (
                    <div className="p-10 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Clock size={28} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="font-display font-bold text-brand-navy text-lg">Link expirado</p>
                            <p className="text-sm text-brand-navy/40 mt-1">
                                Este link de descarga ya no está disponible.
                                {info?.expiresAt && ` Venció el ${formatDateTime(info.expiresAt)}.`}
                            </p>
                            <p className="text-xs text-brand-navy/30 mt-2">Contactá al remitente para solicitar un nuevo link.</p>
                        </div>
                    </div>
                )}

                {!loading && !error && info && !expired && (
                    <>
                        {/* Doc header */}
                        <div className="bg-brand-navy px-6 py-5 flex items-center gap-4">
                            <div className="p-2.5 bg-brand-gold rounded-xl shrink-0">
                                <FileText size={22} className="text-brand-navy" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-display font-bold text-white text-sm leading-tight truncate">{info.documentFileName}</p>
                                <p className="text-[10px] text-brand-gold tracking-widest font-bold mt-0.5">
                                    {info.documentTypeName || 'Documento'}
                                </p>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="px-6 py-5 space-y-3 border-b border-brand-navy/5">
                            <div className="flex items-center gap-3 text-sm">
                                <FolderOpen size={15} className="text-brand-navy/30 shrink-0" />
                                <span className="text-brand-navy/50">Carpeta:</span>
                                <span className="font-bold text-brand-navy font-mono">{info.operationNroCarpeta}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <User size={15} className="text-brand-navy/30 shrink-0" />
                                <span className="text-brand-navy/50">Compartido por:</span>
                                <span className="font-bold text-brand-navy">{info.createdByName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar size={15} className="text-brand-navy/30 shrink-0" />
                                <span className="text-brand-navy/50">Cliente:</span>
                                <span className="font-bold text-brand-navy">{info.clientRazonSocial}</span>
                            </div>
                        </div>

                        {/* Expiry badge */}
                        <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2">
                            <Clock size={13} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700">
                                <span className="font-bold">Válido hasta:</span> {formatDateTime(info.expiresAt)}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-3">
                            <a
                                href={getShareFileUrl(token, 'inline')}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 bg-brand-slate-50 border border-brand-navy/10 text-brand-navy font-bold py-3.5 rounded-xl text-sm hover:border-brand-navy/30 hover:bg-white transition-all"
                            >
                                <Eye size={16} /> Ver
                            </a>
                            <a
                                href={getShareFileUrl(token, 'attachment')}
                                download
                                className="flex items-center justify-center gap-2 bg-brand-navy text-white font-bold py-3.5 rounded-xl text-sm hover:bg-brand-navy/90 transition-all shadow-lg shadow-brand-navy/20"
                            >
                                <Download size={16} className="text-brand-gold" /> Descargar
                            </a>
                        </div>
                    </>
                )}
            </div>

            <p className="mt-8 text-xs text-brand-navy/50">
                Este documento fue compartido de forma segura a través de la plataforma de López Vener
            </p>
        </div>
    );
};

export default PublicSharePage;
