import { Menu, Bell } from 'lucide-react';
import { useAppAuth } from '../contexts/AuthContext';
import logoSvg from '../assets/LogoLV.svg';

const ROLE_LABELS = {
    admin:   'Administrador',
    jefe:    'Jefe Operativo',
    emp_imp: 'Empleado Importaciones',
    emp_exp: 'Empleado Exportaciones',
    emp_adm: 'Empleado Administrativo',
    cliente: 'Cliente',
};

const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Header = ({ onMenuToggle }) => {
    const { user } = useAppAuth();

    const displayName = user?.fullName || user?.email || 'Usuario';
    // Multi-rol: mostrar todos los labels separados por " · "
    const roleLabel = (user?.roles ?? [])
        .map(r => ROLE_LABELS[r] || r)
        .join(' · ');
    const initials    = getInitials(displayName);

    return (
        <header className="h-16 bg-brand-navy flex items-center justify-between px-4 md:px-6 font-sans shrink-0 z-40">
            {/* Izquierda: hamburger + logo */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    className="p-2 text-white/60 hover:text-brand-gold transition-colors rounded-lg hover:bg-white/5"
                    aria-label="Toggle menú"
                >
                    <Menu size={20} />
                </button>

                <div className="flex items-center gap-0">
                    <img
                        src={logoSvg}
                        alt="López Vener & Asoc."
                        className="h-7 w-auto"
                        style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(340deg) brightness(0.95)' }}
                    />
                </div>
            </div>

            {/* Derecha: notificaciones + usuario */}
            <div className="flex items-center gap-4">
                {/* Campana con container */}
                <button className="relative w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/15 rounded-xl text-white/70 hover:text-brand-gold transition-all">
                    <Bell size={17} strokeWidth={1.8} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-gold rounded-full border-2 border-brand-navy" />
                </button>

                <div className="w-px h-5 bg-white/10" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white leading-tight">{displayName}</p>
                        <p className="text-[10px] text-brand-gold font-semibold tracking-wide mt-0.5">{roleLabel}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full border-2 border-brand-gold/40 shrink-0 bg-white/10 flex items-center justify-center">
                        <span className="text-brand-gold font-bold text-sm">{initials}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
