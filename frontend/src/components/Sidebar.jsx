import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, X, BookOpen, Mail, ChevronDown, GitBranch, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppAuth } from '../contexts/AuthContext';

const Sidebar = ({ activePage, onNavigate, isOpen, onClose, onExpand }) => {
    const { logout, hasPermission, user } = useAppAuth();
    const [hoveredItem, setHoveredItem] = useState(null);
    const [configExpanded, setConfigExpanded] = useState(false);

    const isAdminRole = user?.roles?.some(r => ['admin', 'jefe'].includes(r.toLowerCase()));

    const mainItems = [
        { id: 'dashboard',   icon: LayoutDashboard, label: 'Resumen Operativo', permission: null },
        { id: 'clientes',    icon: Users,            label: 'Clientes',          permission: 'PAGE_CLIENTES' },
        { id: 'expedientes', icon: FileText,         label: 'Carpetas',          permission: 'PAGE_OPERACIONES' },
        { id: 'usuarios',    icon: UserCog,          label: 'Usuarios',          permission: 'PAGE_USUARIOS' },
    ].filter(item => item.permission === null || hasPermission(item.permission));

    // Subitems de Configuración — solo para admin
    const isAdminOnly = user?.roles?.includes('admin');

    const configChildren = isAdminRole ? [
        { id: 'tipos-documento',   icon: BookOpen,   label: 'Tipos de Documento' },
        { id: 'workflow-states',   icon: GitBranch,  label: 'Estados de Workflow' },
        { id: 'contact-types',     icon: Users,      label: 'Tipos de Contacto' },
        ...(isAdminOnly ? [{ id: 'email-templates', icon: Mail, label: 'Templates de Email' }] : []),
    ] : [];

    const showConfig = hasPermission('PAGE_CONFIG') || isAdminRole;
    const isInConfig = ['config', 'tipos-documento', 'email-templates', 'workflow-states', 'contact-types'].includes(activePage);

    // Auto-expande si la página activa es un hijo de config
    const [configManuallySet, setConfigManuallySet] = useState(false);
    const isConfigOpen = configManuallySet ? configExpanded : (configExpanded || isInConfig);

    const handleConfigToggle = () => {
        if (!isOpen) {
            // Sidebar colapsado: expandirlo primero y luego mostrar submenu
            onExpand?.();
            setConfigExpanded(true);
            setConfigManuallySet(true);
        } else {
            setConfigManuallySet(true);
            setConfigExpanded(v => !v);
        }
    };

    // Mobile: navega y cierra el overlay
    const handleMobileNavigate = (id) => {
        onNavigate(id);
        onClose();
    };

    // ── Desktop NavButton ─────────────────────────────────────────────────────
    const DesktopNavButton = ({ item, indent = false }) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        const isHovered = hoveredItem === item.id;

        return (
            <div
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
            >
                <button
                    onClick={() => onNavigate(item.id)}
                    title={!isOpen ? item.label : undefined}
                    className={`
                        w-full flex items-center rounded-xl transition-all duration-200
                        ${isOpen ? `gap-3 ${indent ? 'pl-8 pr-3' : 'px-3'} py-2.5` : 'justify-center py-3'}
                        ${isActive
                            ? 'bg-white/10 text-brand-gold'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }
                    `}
                >
                    <Icon
                        size={indent ? 16 : 20}
                        className={`shrink-0 ${isActive ? 'text-brand-gold' : ''}`}
                        strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {isOpen && (
                        <span className={`font-medium whitespace-nowrap overflow-hidden ${indent ? 'text-xs' : 'text-sm'}`}>
                            {item.label}
                        </span>
                    )}
                    {isActive && !isOpen && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-gold rounded-l-full" />
                    )}
                </button>

                {/* Tooltip */}
                {!isOpen && isHovered && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] pointer-events-none">
                        <div className="bg-brand-navy border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                            {item.label}
                            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-navy" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── Desktop sidebar ───────────────────────────────────────────────────────
    const desktopSidebar = (
        <aside className={`
            hidden lg:flex flex-col
            ${isOpen ? 'w-64' : 'w-[65px]'}
            bg-brand-navy text-white
            border-r border-white/5
            transition-all duration-300 ease-in-out
            overflow-visible shrink-0
        `}>
            <nav className="flex-1 flex flex-col gap-0.5 pt-4 px-2">
                {mainItems.map(item => (
                    <DesktopNavButton key={item.id} item={item} />
                ))}

                {/* Configuración (expandable) */}
                {showConfig && (
                    <div>
                        <div
                            className="relative"
                            onMouseEnter={() => setHoveredItem('config-parent')}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <button
                                onClick={handleConfigToggle}
                                className={`
                                    w-full flex items-center rounded-xl transition-all duration-200
                                    ${isOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'}
                                    ${isInConfig
                                        ? 'bg-white/10 text-brand-gold'
                                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <Settings
                                    size={20}
                                    className={`shrink-0 ${isInConfig ? 'text-brand-gold' : ''}`}
                                    strokeWidth={isInConfig ? 2.5 : 1.8}
                                />
                                {isOpen && (
                                    <>
                                        <span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden">
                                            Configuración
                                        </span>
                                        <ChevronDown
                                            size={13}
                                            className={`shrink-0 transition-transform duration-200 ${isConfigOpen ? 'rotate-180' : ''}`}
                                        />
                                    </>
                                )}
                                {isInConfig && !isOpen && (
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-gold rounded-l-full" />
                                )}
                            </button>

                            {!isOpen && hoveredItem === 'config-parent' && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] pointer-events-none">
                                    <div className="bg-brand-navy border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                        Configuración
                                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-navy" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subitems */}
                        <AnimatePresence initial={false}>
                            {isOpen && isConfigOpen && configChildren.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-0.5 space-y-0.5 border-l border-white/10 ml-6 pl-2">
                                        {configChildren.map(child => (
                                            <DesktopNavButton key={child.id} item={child} indent />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </nav>

            {/* Logout */}
            <div className="pb-4 px-2 mt-auto border-t border-white/5 pt-4">
                <div
                    className="relative"
                    onMouseEnter={() => setHoveredItem('logout')}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <button
                        onClick={logout}
                        className={`
                            w-full flex items-center rounded-xl transition-all duration-200
                            text-white/30 hover:text-red-400 hover:bg-white/5
                            ${isOpen ? 'gap-3 px-3 py-3' : 'justify-center py-3'}
                        `}
                    >
                        <LogOut size={20} strokeWidth={1.8} className="shrink-0" />
                        {isOpen && (
                            <span className="text-xs font-bold tracking-wide whitespace-nowrap overflow-hidden">
                                Cerrar sesión
                            </span>
                        )}
                    </button>

                    {!isOpen && hoveredItem === 'logout' && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] pointer-events-none">
                            <div className="bg-brand-navy border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                Cerrar sesión
                                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-navy" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    // ── Mobile overlay ────────────────────────────────────────────────────────
    const mobileOverlay = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[50] lg:hidden"
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed top-0 left-0 h-full w-64 bg-brand-navy text-white z-[55] flex flex-col lg:hidden shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 shrink-0">
                            <span className="text-white font-bold text-sm tracking-wide">Menú</span>
                            <button
                                onClick={onClose}
                                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <nav className="flex-1 flex flex-col gap-0.5 pt-3 px-2 overflow-y-auto">
                            {mainItems.map(item => {
                                const Icon = item.icon;
                                const isActive = activePage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleMobileNavigate(item.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                                            isActive
                                                ? 'bg-white/10 text-brand-gold'
                                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                );
                            })}

                            {/* Config mobile */}
                            {showConfig && (
                                <div>
                                    <button
                                        onClick={handleConfigToggle}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                                            isInConfig
                                                ? 'bg-white/10 text-brand-gold'
                                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <Settings size={20} strokeWidth={isInConfig ? 2.5 : 1.8} className="shrink-0" />
                                        <span className="text-sm font-medium flex-1 text-left">Configuración</span>
                                        <ChevronDown size={13} className={`transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isConfigOpen && configChildren.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-l border-white/10 ml-6 pl-2 mt-0.5 space-y-0.5">
                                                    {configChildren.map(child => {
                                                        const Icon = child.icon;
                                                        const isActive = activePage === child.id;
                                                        return (
                                                            <button
                                                                key={child.id}
                                                                onClick={() => handleMobileNavigate(child.id)}
                                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                                                                    isActive
                                                                        ? 'bg-white/10 text-brand-gold'
                                                                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                                                                }`}
                                                            >
                                                                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
                                                                <span className="text-xs font-medium">{child.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </nav>

                        <div className="pb-4 px-2 border-t border-white/5 pt-4">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                            >
                                <LogOut size={20} strokeWidth={1.8} />
                                <span className="text-xs font-bold tracking-wide">Cerrar sesión</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {desktopSidebar}
            {mobileOverlay}
        </>
    );
};

export default Sidebar;
