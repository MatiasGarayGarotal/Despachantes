/**
 * rolePermissions.js — Fuente de verdad para la UI.
 *
 * Mapea el rol del JWT de Zitadel al conjunto de códigos de permiso que
 * controlan la visibilidad de botones y secciones en la aplicación.
 *
 * PROHIBIDO: consultar BD o un endpoint para este fin.
 * Para modificar permisos de un rol, editar este archivo y hacer deploy.
 *
 * Roles en Zitadel (en minúscula):
 *   admin    — Administrador IT. Acceso total al sistema, incluyendo email templates.
 *   jefe     — Dueño del estudio. Acceso total al negocio (sin gestión de usuarios ni email templates).
 *   emp_exp  — Empleado Exportaciones. Gestión de operaciones; no factura ni configura.
 *   emp_imp  — Empleado Importaciones. Gestión de operaciones; no factura ni configura.
 *   emp_adm  — Empleado Administrativo. Gestión de operaciones; no factura ni configura.
 *   cliente  — Cliente externo. Solo visualiza sus carpetas y descarga documentos.
 *
 * REGLA CRÍTICA: PAGE_CONFIG_EMAIL_TEMPLATES es EXCLUSIVO del rol admin.
 */

const ROLE_PERMISSIONS = {
    admin: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Usuarios internos (gestión contra Zitadel)
        'PAGE_USUARIOS',
        // Clientes
        'PAGE_CLIENTES', 'BTN_CREAR_CLIENTE', 'BTN_EDITAR_CLIENTE', 'BTN_ELIMINAR_CLIENTE',
        // Operaciones
        'PAGE_OPERACIONES', 'BTN_CREAR_OPERACION', 'BTN_EDITAR_OPERACION', 'BTN_CAMBIAR_ESTADO',
        'BTN_ELIMINAR_OPERACION', 'VIEW_OPERACIONES_TODAS',
        // Documentos
        'BTN_SUBIR_DOCUMENTO', 'BTN_DESCARGAR_DOCUMENTO', 'BTN_ELIMINAR_DOCUMENTO', 'BTN_COMPARTIR_DOCUMENTO',
        // Facturación
        'PAGE_PROFORMAS', 'BTN_CREAR_PROFORMA', 'VIEW_DATOS_FACTURACION',
        // Alertas
        'PAGE_ALERTAS',
        // Configuración (acceso total, incluyendo email templates — SOLO admin)
        'PAGE_CONFIG', 'PAGE_CONFIG_USUARIOS', 'BTN_CREAR_USUARIO', 'BTN_EDITAR_USUARIO', 'BTN_DESACTIVAR_USUARIO',
        'PAGE_CONFIG_ROLES', 'BTN_EDITAR_PERMISOS_ROL', 'PAGE_CONFIG_SESIONES', 'PAGE_CONFIG_DOC_TYPES',
        'PAGE_CONFIG_EMAIL_TEMPLATES',
    ],

    jefe: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Usuarios internos (gestión contra Zitadel)
        'PAGE_USUARIOS',
        // Clientes
        'PAGE_CLIENTES', 'BTN_CREAR_CLIENTE', 'BTN_EDITAR_CLIENTE', 'BTN_ELIMINAR_CLIENTE',
        // Operaciones
        'PAGE_OPERACIONES', 'BTN_CREAR_OPERACION', 'BTN_EDITAR_OPERACION', 'BTN_CAMBIAR_ESTADO',
        'BTN_ELIMINAR_OPERACION', 'VIEW_OPERACIONES_TODAS',
        // Documentos
        'BTN_SUBIR_DOCUMENTO', 'BTN_DESCARGAR_DOCUMENTO', 'BTN_ELIMINAR_DOCUMENTO', 'BTN_COMPARTIR_DOCUMENTO',
        // Facturación
        'PAGE_PROFORMAS', 'BTN_CREAR_PROFORMA', 'VIEW_DATOS_FACTURACION',
        // Alertas
        'PAGE_ALERTAS',
        // Configuración (tipos de documento y contacto — sin usuarios, roles ni email templates)
        'PAGE_CONFIG', 'PAGE_CONFIG_DOC_TYPES',
        // NOTA: NO tiene PAGE_CONFIG_EMAIL_TEMPLATES
    ],

    emp_exp: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Clientes (solo lectura)
        'PAGE_CLIENTES',
        // Operaciones (gestión de sus propias carpetas)
        'PAGE_OPERACIONES', 'BTN_CREAR_OPERACION', 'BTN_EDITAR_OPERACION', 'BTN_CAMBIAR_ESTADO',
        // Documentos
        'BTN_SUBIR_DOCUMENTO', 'BTN_DESCARGAR_DOCUMENTO', 'BTN_ELIMINAR_DOCUMENTO', 'BTN_COMPARTIR_DOCUMENTO',
        // Alertas
        'PAGE_ALERTAS',
        // Sin acceso a: facturación, configuración, BTN_ELIMINAR_OPERACION, gestión de clientes
    ],

    emp_imp: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Clientes (solo lectura)
        'PAGE_CLIENTES',
        // Operaciones (gestión de sus propias carpetas)
        'PAGE_OPERACIONES', 'BTN_CREAR_OPERACION', 'BTN_EDITAR_OPERACION', 'BTN_CAMBIAR_ESTADO',
        // Documentos
        'BTN_SUBIR_DOCUMENTO', 'BTN_DESCARGAR_DOCUMENTO', 'BTN_ELIMINAR_DOCUMENTO', 'BTN_COMPARTIR_DOCUMENTO',
        // Alertas
        'PAGE_ALERTAS',
        // Sin acceso a: facturación, configuración, BTN_ELIMINAR_OPERACION, gestión de clientes
    ],

    emp_adm: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Clientes (solo lectura)
        'PAGE_CLIENTES',
        // Operaciones (gestión de sus propias carpetas)
        'PAGE_OPERACIONES', 'BTN_CREAR_OPERACION', 'BTN_EDITAR_OPERACION', 'BTN_CAMBIAR_ESTADO',
        // Documentos
        'BTN_SUBIR_DOCUMENTO', 'BTN_DESCARGAR_DOCUMENTO', 'BTN_ELIMINAR_DOCUMENTO', 'BTN_COMPARTIR_DOCUMENTO',
        // Alertas
        'PAGE_ALERTAS',
        // Sin acceso a: facturación, configuración, BTN_ELIMINAR_OPERACION, gestión de clientes
    ],

    cliente: [
        // Dashboard
        'PAGE_DASHBOARD',
        // Operaciones (solo ve sus propias carpetas — filtrado en backend)
        'PAGE_OPERACIONES',
        // Documentos (solo descarga)
        'BTN_DESCARGAR_DOCUMENTO',
        // Sin acceso a: clientes, estados, subir/eliminar documentos, facturación, config
    ],
};

/**
 * Retorna el Set de permisos para un rol dado.
 * @param {string} role
 * @returns {Set<string>}
 */
export function getPermissionsForRole(role) {
    const permissions = ROLE_PERMISSIONS[role?.toLowerCase()] ?? [];
    return new Set(permissions);
}

/**
 * Retorna el Set de permisos combinados para una lista de roles (multi-rol).
 * La unión de permisos permite que un usuario con varios roles acceda a todo lo que permite cualquiera de ellos.
 * @param {string[]} roles
 * @returns {Set<string>}
 */
export function getPermissionsForRoles(roles) {
    const combined = new Set();
    for (const role of (roles ?? [])) {
        for (const perm of (ROLE_PERMISSIONS[role?.toLowerCase()] ?? [])) {
            combined.add(perm);
        }
    }
    return combined;
}
