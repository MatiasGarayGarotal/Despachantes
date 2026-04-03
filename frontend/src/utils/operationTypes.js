/**
 * Constantes de Tipos de Operación (Carpetas)
 * Valores fijos: IMPORTACION, EXPORTACION, TRANSITO
 */

export const OPERATION_TYPES = [
    {
        value: 'IMPORTACION',
        label: 'Importación',
        shortLabel: 'IMP',
        badgeBg: '#E8EDF8',
        badgeText: '#2E4A7D',
    },
    {
        value: 'EXPORTACION',
        label: 'Exportación',
        shortLabel: 'EXP',
        badgeBg: '#FDF6EE',
        badgeText: '#8B6530',
    },
    {
        value: 'TRANSITO',
        label: 'Tránsito',
        shortLabel: 'TRA',
        badgeBg: '#EDF8F0',
        badgeText: '#276749',
    },
];

// Lookup map
export const OPERATION_TYPE_MAP = Object.fromEntries(
    OPERATION_TYPES.map(t => [t.value, t])
);

/**
 * Retorna el label de un tipo de operación
 */
export const getOperationTypeLabel = (value) =>
    OPERATION_TYPE_MAP[value]?.label ?? value;

/**
 * Retorna el objeto completo de un tipo de operación
 */
export const getOperationType = (value) =>
    OPERATION_TYPE_MAP[value];

/**
 * Retorna el color de badge para un tipo (usa style inline)
 */
export const getOperationTypeBadgeStyle = (value) => {
    const type = OPERATION_TYPE_MAP[value];
    return type ? { background: type.badgeBg, color: type.badgeText } : {};
};
