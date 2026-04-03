-- =============================================================
-- V003: Sistema de permisos granulares
-- =============================================================
-- permissions: catálogo de todas las acciones posibles del sistema.
--   code: identificador técnico usado en el frontend/backend (ej: BTN_CREAR_OPERACION)
--   module: agrupa permisos en la pantalla de configuración
--
-- role_permissions: qué permisos tiene cada rol.
--   Esta tabla es la que modifica el admin desde la pantalla de configuración.
-- =============================================================

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100)    NOT NULL UNIQUE,
    name        VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    module      VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Catálogo de todos los permisos posibles del sistema. No se modifica en runtime.';
COMMENT ON COLUMN permissions.code IS 'Identificador técnico. Ej: BTN_CREAR_OPERACION. Usado en frontend con hasPermission().';
COMMENT ON COLUMN permissions.module IS 'Módulo al que pertenece para agrupar en la UI de configuración.';

CREATE TABLE role_permissions (
    role            VARCHAR(50)     NOT NULL,
    permission_code VARCHAR(100)    NOT NULL,
    granted_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role, permission_code),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE
);

COMMENT ON TABLE role_permissions IS 'Define qué permisos tiene cada rol. Editable desde la pantalla de configuración.';

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
