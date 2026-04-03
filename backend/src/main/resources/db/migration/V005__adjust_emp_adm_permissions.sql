-- =============================================================
-- V005: Ajuste de permisos EMP_ADM
-- EMP_ADM es un rol de consulta y soporte administrativo.
-- No debe poder crear ni eliminar clientes (solo visualizar y editar).
-- =============================================================

DELETE FROM role_permissions
WHERE role = 'EMP_ADM'
  AND permission_code IN ('BTN_CREAR_CLIENTE', 'BTN_ELIMINAR_CLIENTE');
