/**
 * StateSelector — Selector de estado estilo lista custom (Concepto 2).
 * Muestra todos los estados con visual de progreso:
 *   - Pasados:  check + texto tachado
 *   - Actual:   resaltado en gold
 *   - Futuros:  círculo vacío + clickeable
 *
 * Props:
 *   statuses       → array [{ key, label }]
 *   currentState   → string (key del estado actual)
 *   onSelect       → fn(newStateKey) — se llama cuando el usuario elige un estado futuro
 *   disabled       → boolean
 */

const StateSelector = ({ statuses, currentState, onSelect, disabled = false }) => {
    const currentIdx = statuses.findIndex(s => s.key === currentState);

    return (
        <div className="bg-brand-slate-50 rounded-2xl p-2 space-y-0.5">
            {statuses.map((s, idx) => {
                const isPast    = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isFuture  = idx > currentIdx;

                return (
                    <button
                        key={s.key}
                        type="button"
                        disabled={disabled || isCurrent}
                        onClick={() => !isCurrent && !disabled && onSelect(s.key)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                            ${isCurrent
                                ? 'bg-brand-gold/10 border-2 border-brand-gold/40 cursor-default'
                                : disabled
                                    ? 'border-2 border-transparent cursor-not-allowed opacity-50'
                                    : isPast
                                        ? 'border-2 border-transparent hover:bg-amber-50/70 hover:border-amber-200/60 cursor-pointer group'
                                        : 'border-2 border-transparent hover:bg-white hover:border-brand-navy/8 cursor-pointer group'
                            }
                        `}
                    >
                        {/* Indicador */}
                        <div className={`
                            shrink-0 flex items-center justify-center rounded-full transition-all w-4 h-4
                            ${isCurrent ? 'bg-brand-gold' : ''}
                            ${isPast    ? 'bg-brand-navy/70' : ''}
                            ${isFuture  ? 'border-2 border-brand-navy/20' : ''}
                        `}>
                            {isPast && (
                                <svg width="8" height="8" fill="white" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                            )}
                        </div>

                        {/* Label */}
                        <span className={`
                            flex-1 text-xs font-bold transition-colors
                            ${isCurrent ? 'text-brand-navy' : ''}
                            ${isPast && !disabled ? 'text-brand-navy/50 line-through decoration-brand-navy/40 group-hover:text-amber-700 group-hover:decoration-amber-400/70' : ''}
                            ${isPast && disabled ? 'text-brand-navy/50 line-through decoration-brand-navy/40' : ''}
                            ${isFuture && !disabled ? 'text-brand-navy/60 group-hover:text-brand-navy' : ''}
                            ${isFuture && disabled ? 'text-brand-navy/50' : ''}
                        `}>
                            {s.label}
                        </span>

                        {/* Badges */}
                        {isCurrent && (
                            <span className="text-[9px] bg-brand-gold/20 text-brand-gold font-bold px-2 py-0.5 rounded-full shrink-0">
                                ACTUAL
                            </span>
                        )}
                        {isPast && !disabled && (
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                className="text-transparent group-hover:text-amber-500/70 transition-colors shrink-0">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        )}
                        {isFuture && !disabled && (
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                className="text-brand-navy/20 group-hover:text-brand-gold transition-colors shrink-0">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        )}

                        {/* Número de paso */}
                        <span className="text-[9px] font-mono text-brand-navy/35 shrink-0 w-4 text-right">
                            {idx + 1}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default StateSelector;
