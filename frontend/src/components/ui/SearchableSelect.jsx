import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * Reemplaza <select> con búsqueda/filtro integrado.
 *
 * Props:
 * - value: string — valor seleccionado actualmente
 * - onChange: (value: string) => void
 * - options: Array<{ value: string, label: string }>
 * - placeholder?: string
 * - disabled?: boolean
 * - required?: boolean
 */
const SearchableSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => o.value === value);

    const filtered = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        if (disabled) return;
        setOpen(true);
        setSearch('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (optValue) => {
        onChange(optValue);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full bg-brand-slate-50 border border-brand-navy/10 rounded-xl py-3 px-4 text-sm text-left flex items-center justify-between outline-none transition-all disabled:opacity-50 disabled:cursor-default ${
                    open
                        ? 'bg-white border-brand-gold/60 ring-4 ring-brand-gold/5'
                        : 'hover:border-brand-navy/20'
                }`}
            >
                <span className={selected ? 'text-brand-navy font-medium truncate pr-2' : 'text-brand-navy/40'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-brand-navy/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-brand-navy/10 shadow-xl shadow-brand-navy/10 overflow-hidden">
                    <div className="p-2 border-b border-brand-navy/5">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/30" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-brand-slate-50 border border-brand-navy/10 rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:bg-white focus:border-brand-gold/40 transition-all"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-center text-xs text-brand-navy/30 py-4">
                                {search ? `Sin resultados para "${search}"` : 'Sin opciones'}
                            </p>
                        ) : (
                            filtered.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-brand-gold/[0.06] ${
                                        o.value === value
                                            ? 'font-bold text-brand-navy bg-brand-gold/[0.04]'
                                            : 'text-brand-navy/80'
                                    }`}
                                >
                                    {o.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
