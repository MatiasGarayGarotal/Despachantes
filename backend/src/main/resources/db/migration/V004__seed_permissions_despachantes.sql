-- =============================================================
-- V004: Permisos del sistema DespachantesV2
-- =============================================================
-- Convención de códigos:
--   PAGE_*   → acceso a una página/sección completa
--   BTN_*    → acción específica (botón, menú item)
--   VIEW_*   → ver información sensible (sin poder editarla)
-- =============================================================

-- ─── Módulo: Dashboard ────────────────────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_DASHBOARD', 'Ver Dashboard', 'Acceso a la pantalla principal', 'Dashboard');

-- ─── Módulo: Clientes ─────────────────────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_CLIENTES',       'Ver sección Clientes',      'Acceso a la lista de clientes',          'Clientes'),
    ('BTN_CREAR_CLIENTE',   'Crear Cliente',             'Botón para crear un cliente nuevo',      'Clientes'),
    ('BTN_EDITAR_CLIENTE',  'Editar Cliente',            'Botón para editar datos de un cliente',  'Clientes'),
    ('BTN_ELIMINAR_CLIENTE','Eliminar Cliente',          'Botón para dar de baja un cliente',      'Clientes');

-- ─── Módulo: Operaciones ──────────────────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_OPERACIONES',        'Ver sección Operaciones',   'Acceso a la lista de operaciones',              'Operaciones'),
    ('BTN_CREAR_OPERACION',     'Crear Operación',           'Botón para abrir una carpeta nueva',            'Operaciones'),
    ('BTN_EDITAR_OPERACION',    'Editar Operación',          'Botón para modificar datos de una operación',   'Operaciones'),
    ('BTN_CAMBIAR_ESTADO',      'Cambiar Estado',            'Botón para avanzar el estado de una carpeta',   'Operaciones'),
    ('BTN_ELIMINAR_OPERACION',  'Eliminar Operación',        'Botón para dar de baja una operación',          'Operaciones'),
    ('VIEW_OPERACIONES_TODAS',  'Ver operaciones de todos',  'Ver carpetas de cualquier operador (no solo las propias)', 'Operaciones');

-- ─── Módulo: Documentos ───────────────────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('BTN_SUBIR_DOCUMENTO',     'Subir Documento',           'Botón para adjuntar un archivo',                'Documentos'),
    ('BTN_DESCARGAR_DOCUMENTO', 'Descargar Documento',       'Botón para descargar un archivo',              'Documentos'),
    ('BTN_ELIMINAR_DOCUMENTO',  'Eliminar Documento',        'Botón para borrar un documento',               'Documentos'),
    ('BTN_COMPARTIR_DOCUMENTO', 'Compartir con Cliente',     'Marcar un documento como visible al cliente',  'Documentos');

-- ─── Módulo: Proforma / Liquidación ──────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_PROFORMAS',          'Ver sección Proformas',     'Acceso al módulo de proformas',         'Proformas'),
    ('BTN_CREAR_PROFORMA',      'Crear Proforma',            'Generar una liquidación de gastos',     'Proformas'),
    ('VIEW_DATOS_FACTURACION',  'Ver datos de facturación',  'Ver montos, honorarios y tributos',     'Proformas');

-- ─── Módulo: Alertas / Vencimientos ──────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_ALERTAS',    'Ver sección Alertas',  'Acceso al panel de vencimientos y alertas', 'Alertas');

-- ─── Módulo: Configuración ────────────────────────────────────
INSERT INTO permissions (code, name, description, module) VALUES
    ('PAGE_CONFIG',                 'Ver Configuración',            'Acceso al menú de configuración',                  'Configuración'),
    ('PAGE_CONFIG_USUARIOS',        'Gestionar Usuarios',           'Ver y editar usuarios del sistema',                'Configuración'),
    ('BTN_CREAR_USUARIO',           'Crear Usuario',                'Botón para crear un usuario nuevo',                'Configuración'),
    ('BTN_EDITAR_USUARIO',          'Editar Usuario',               'Botón para modificar un usuario',                  'Configuración'),
    ('BTN_DESACTIVAR_USUARIO',      'Desactivar Usuario',           'Botón para desactivar un usuario',                 'Configuración'),
    ('PAGE_CONFIG_ROLES',           'Gestionar Roles y Permisos',   'Ver y editar qué permisos tiene cada rol',         'Configuración'),
    ('BTN_EDITAR_PERMISOS_ROL',     'Editar Permisos de un Rol',    'Asignar o quitar permisos a un rol',               'Configuración'),
    ('PAGE_CONFIG_SESIONES',        'Ver Sesiones Activas',         'Dashboard de usuarios logueados actualmente',       'Configuración'),
    ('PAGE_CONFIG_DOC_TYPES',       'Gestionar Tipos de Documento', 'Configurar el catálogo de tipos de documento',     'Configuración');

-- =============================================================
-- Asignación de permisos por rol (estado inicial)
-- Ajustable desde la pantalla de configuración sin tocar código.
-- =============================================================

-- ADMIN: acceso total
INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions;

-- JEFE: acceso total al negocio (igual que ADMIN excepto gestión técnica de usuarios)
INSERT INTO role_permissions (role, permission_code)
SELECT 'JEFE', code FROM permissions
WHERE code NOT IN ('PAGE_CONFIG_USUARIOS', 'BTN_CREAR_USUARIO', 'BTN_EDITAR_USUARIO', 'BTN_DESACTIVAR_USUARIO');

-- EMP_IMP: Empleado de Importaciones
INSERT INTO role_permissions (role, permission_code) VALUES
    ('EMP_IMP', 'PAGE_DASHBOARD'),
    ('EMP_IMP', 'PAGE_CLIENTES'),
    ('EMP_IMP', 'PAGE_OPERACIONES'),
    ('EMP_IMP', 'BTN_CREAR_OPERACION'),
    ('EMP_IMP', 'BTN_EDITAR_OPERACION'),
    ('EMP_IMP', 'BTN_CAMBIAR_ESTADO'),
    ('EMP_IMP', 'BTN_SUBIR_DOCUMENTO'),
    ('EMP_IMP', 'BTN_DESCARGAR_DOCUMENTO'),
    ('EMP_IMP', 'PAGE_ALERTAS');

-- EMP_EXP: Empleado de Exportaciones (igual que IMP por ahora)
INSERT INTO role_permissions (role, permission_code) VALUES
    ('EMP_EXP', 'PAGE_DASHBOARD'),
    ('EMP_EXP', 'PAGE_CLIENTES'),
    ('EMP_EXP', 'PAGE_OPERACIONES'),
    ('EMP_EXP', 'BTN_CREAR_OPERACION'),
    ('EMP_EXP', 'BTN_EDITAR_OPERACION'),
    ('EMP_EXP', 'BTN_CAMBIAR_ESTADO'),
    ('EMP_EXP', 'BTN_SUBIR_DOCUMENTO'),
    ('EMP_EXP', 'BTN_DESCARGAR_DOCUMENTO'),
    ('EMP_EXP', 'PAGE_ALERTAS');

-- EMP_ADM: Empleado Administrativo
INSERT INTO role_permissions (role, permission_code) VALUES
    ('EMP_ADM', 'PAGE_DASHBOARD'),
    ('EMP_ADM', 'PAGE_CLIENTES'),
    ('EMP_ADM', 'BTN_CREAR_CLIENTE'),
    ('EMP_ADM', 'BTN_EDITAR_CLIENTE'),
    ('EMP_ADM', 'PAGE_OPERACIONES'),
    ('EMP_ADM', 'VIEW_OPERACIONES_TODAS'),
    ('EMP_ADM', 'BTN_DESCARGAR_DOCUMENTO'),
    ('EMP_ADM', 'PAGE_PROFORMAS'),
    ('EMP_ADM', 'BTN_CREAR_PROFORMA'),
    ('EMP_ADM', 'VIEW_DATOS_FACTURACION'),
    ('EMP_ADM', 'PAGE_ALERTAS');

-- CLIENT: Cliente externo (solo ve sus propias carpetas y documentos compartidos)
INSERT INTO role_permissions (role, permission_code) VALUES
    ('CLIENT', 'PAGE_DASHBOARD'),
    ('CLIENT', 'PAGE_OPERACIONES'),
    ('CLIENT', 'BTN_DESCARGAR_DOCUMENTO');
