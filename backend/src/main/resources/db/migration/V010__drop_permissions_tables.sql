-- =============================================================
-- V010: Eliminar tablas de permisos personalizados
-- =============================================================
-- CONTEXTO: Se abandona el modelo role_permissions/permissions de BD.
-- Los permisos de UI ahora se derivan exclusivamente del rol del JWT
-- emitido por Zitadel. El mapa rol→permisos vive en el frontend (rolePermissions.js).
-- El backend solo valida el JWT y expone el rol al frontend.
-- =============================================================

-- 1. Eliminar role_permissions primero (tiene FK hacia permissions)
DROP TABLE IF EXISTS role_permissions;

-- 2. Eliminar catálogo de permisos
DROP TABLE IF EXISTS permissions;

-- 3. Actualizar comentario de la columna role para reflejar los nuevos valores
COMMENT ON COLUMN users.role IS 'admin | jefe | operador | cliente — Sincronizado desde Zitadel JWT en cada provisioning';
