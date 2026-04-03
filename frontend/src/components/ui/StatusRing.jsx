/**
 * StatusRing — Rosca SVG que muestra el progreso del estado de una carpeta.
 *
 * Props:
 *   currentState  → string (key del estado actual, e.g. 'CANAL_ASIGNADO')
 *   statuses      → array [{ key, label }] — lista completa de estados en orden
 *   size          → 'sm' | 'md' (default 'md')
 */

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 en viewBox 100x100

const StatusRing = ({ currentState, statuses, size = 'md' }) => {
    const currentIdx = statuses.findIndex(s => s.key === currentState);
    const total = statuses.length;

    const completedFraction = currentIdx / total;
    const currentFraction   = 1 / total;

    const completedLen = completedFraction * CIRCUMFERENCE;
    const currentLen   = currentFraction   * CIRCUMFERENCE;

    const prevLabel = currentIdx > 0          ? statuses[currentIdx - 1].label : null;
    const nextLabel = currentIdx < total - 1  ? statuses[currentIdx + 1].label : null;
    const currLabel = statuses[currentIdx]?.label ?? '';

    const dim = size === 'sm' ? 80 : 110;

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Donut SVG */}
            <div style={{ width: dim, height: dim }} className="relative shrink-0">
                <svg
                    width={dim}
                    height={dim}
                    viewBox="0 0 100 100"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                >
                    {/* Track */}
                    <circle cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#E9EBF0"
                        strokeWidth={size === 'sm' ? 9 : 10}
                    />
                    {/* Arc completados (navy) */}
                    {completedLen > 0 && (
                        <circle cx="50" cy="50" r="40"
                            fill="none"
                            stroke="#0E3048"
                            strokeWidth={size === 'sm' ? 9 : 10}
                            strokeDasharray={`${completedLen} ${CIRCUMFERENCE}`}
                            strokeDashoffset="0"
                            strokeLinecap="butt"
                        />
                    )}
                    {/* Arc estado actual (gold) */}
                    <circle cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#B18F5B"
                        strokeWidth={size === 'sm' ? 9 : 10}
                        strokeDasharray={`${currentLen - 1.5} ${CIRCUMFERENCE}`}
                        strokeDashoffset={`${-completedLen}`}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Texto central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className={`font-bold text-brand-navy leading-none ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                        {currentIdx + 1}/{total}
                    </span>
                    <span className={`font-bold text-brand-gold leading-tight px-1 ${size === 'sm' ? 'text-[8px]' : 'text-[9px]'}`}>
                        {currLabel}
                    </span>
                </div>
            </div>

            {/* Contexto prev / next */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-navy/40">
                {prevLabel ? (
                    <span className="flex items-center gap-1">
                        <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
                        </svg>
                        {prevLabel}
                    </span>
                ) : <span className="opacity-0">·</span>}

                <span className="text-brand-navy/20">·</span>

                {nextLabel ? (
                    <span className="flex items-center gap-1">
                        {nextLabel}
                        <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </span>
                ) : <span className="opacity-0">·</span>}
            </div>
        </div>
    );
};

export default StatusRing;
