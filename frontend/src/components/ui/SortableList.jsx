import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

/**
 * Componente reutilizable de lista ordenable por drag-and-drop
 * Usa HTML5 Drag API (sin librerías externas)
 *
 * Props:
 * - items: Array<{id: string, ...}> — items a renderizar
 * - renderItem: (item, index) => ReactNode — función para renderizar contenido (sin el handle)
 * - onReorder: (newItems) => void — callback después de drop con array reordenado
 * - disabled?: boolean — deshabilita drag
 */
const SortableList = ({ items = [], renderItem, onReorder, disabled = false }) => {
    const dragIndexRef = useRef(null);
    const [dropIndex, setDropIndex] = useState(null);

    const handleDragStart = (e, index) => {
        dragIndexRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (index !== dropIndex) {
            setDropIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDropIndex(null);
    };

    const handleDrop = (e, dropIdx) => {
        e.preventDefault();
        setDropIndex(null);

        const dragIdx = dragIndexRef.current;
        if (dragIdx === null || dragIdx === dropIdx) {
            dragIndexRef.current = null;
            return;
        }

        // Reorder array
        const newItems = [...items];
        const [moved] = newItems.splice(dragIdx, 1);
        newItems.splice(dropIdx, 0, moved);

        onReorder(newItems);
        dragIndexRef.current = null;
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDropIndex(null);
    };

    if (!items.length) {
        return <div className="text-center py-6 text-brand-navy/30 text-sm">Sin items</div>;
    }

    return (
        <div className="space-y-0 divide-y divide-brand-navy/5">
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    draggable={false}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`
                        flex items-center gap-3 px-4 py-3 transition-colors
                        ${dragIndexRef.current === index ? 'opacity-40 bg-slate-50' : ''}
                        ${dropIndex === index && dragIndexRef.current !== index ? 'bg-brand-gold/20 border-l-2 border-l-brand-gold' : ''}
                    `}
                >
                    {/* Drag Handle */}
                    <div
                        draggable={!disabled}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`hidden sm:flex p-1.5 shrink-0 cursor-grab active:cursor-grabbing transition-colors ${
                            disabled ? 'opacity-30 cursor-not-allowed' : 'text-brand-navy/20 hover:text-brand-navy/50'
                        }`}
                        title={disabled ? 'Deshabilitar para reordenar' : 'Arrastrar para reordenar'}
                    >
                        <GripVertical size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {renderItem(item, index)}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SortableList;
