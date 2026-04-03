-- =============================================================
-- V001: Schema inicial - DespachantesV2
-- =============================================================
-- Convenciones:
--   - IDs: UUID (gen_random_uuid())
--   - Todas las tablas tienen created_at y updated_at
--   - Soft delete con deleted_at (NULL = activo)
--   - snake_case en nombres de columnas y tablas
-- Autenticación: Zitadel gestiona passwords y sesiones.
--   La tabla users almacena perfil + rol para autorización.
-- =============================================================

-- 1. Usuarios
-- Zitadel gestiona la autenticación. Aquí guardamos perfil + rol para permisos.
-- zitadel_user_id: el "sub" del JWT. Se completa en el primer login.
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zitadel_user_id     VARCHAR(255)    NOT NULL UNIQUE,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    full_name           VARCHAR(255)    NOT NULL,
    role                VARCHAR(50)     NOT NULL DEFAULT 'EMP_ADM',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    -- client_id: solo para usuarios externos (rol CLIENT). NULL para empleados.
    client_id           UUID            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP       NULL
);

COMMENT ON COLUMN users.role IS 'ADMIN | JEFE | EMP_IMP | EMP_EXP | EMP_ADM | CLIENT';
COMMENT ON COLUMN users.zitadel_user_id IS 'Claim "sub" del JWT de Zitadel. Se asigna en el primer login.';

-- 2. Clientes (empresas importadoras/exportadoras de Gabriel)
-- Uruguay usa RUT (Registro Único Tributario). CUIT es Argentina.
CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut             VARCHAR(20)     NOT NULL UNIQUE,
    razon_social    VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NULL,
    telefono        VARCHAR(50)     NULL,
    direccion       TEXT            NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP       NULL
);

-- FK de users → clients
ALTER TABLE users
    ADD CONSTRAINT fk_user_client FOREIGN KEY (client_id) REFERENCES clients(id);

-- 3. Tipos de documentos (datos maestros configurables)
CREATE TABLE document_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50)     NOT NULL UNIQUE,
    name                VARCHAR(255)    NOT NULL,
    description         TEXT            NULL,
    applies_to          VARCHAR(20)     NOT NULL DEFAULT 'AMBAS',
    via_transporte      VARCHAR(20)     NOT NULL DEFAULT 'TODAS',
    is_always_required  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- 4. Operaciones (carpetas digitales)
CREATE TABLE operations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nro_carpeta             VARCHAR(50)     NOT NULL UNIQUE,
    nro_dua                 VARCHAR(50)     NULL UNIQUE,
    tipo                    VARCHAR(20)     NOT NULL,
    via_transporte          VARCHAR(20)     NOT NULL,
    estado                  VARCHAR(50)     NOT NULL DEFAULT 'APERTURA',
    canal_dna               VARCHAR(20)     NULL,
    proveedor               VARCHAR(255)    NULL,
    descripcion_mercaderia  TEXT            NULL,
    valor_estimado          DECIMAL(15,2)   NULL,
    fecha_apertura          DATE            NOT NULL DEFAULT CURRENT_DATE,
    fecha_levante           DATE            NULL,
    es_admision_temporaria  BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_vencimiento_at    DATE            NULL,
    client_id               UUID            NOT NULL,
    created_by              UUID            NOT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP       NULL,
    CONSTRAINT fk_operation_client  FOREIGN KEY (client_id)  REFERENCES clients(id),
    CONSTRAINT fk_operation_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 5. Documentos
CREATE TABLE documents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name               VARCHAR(255)    NOT NULL,
    content_type            VARCHAR(100)    NOT NULL,
    storage_path            VARCHAR(512)    NOT NULL,
    file_size_bytes         BIGINT          NULL,
    document_type_id        UUID            NULL,
    is_shared_with_client   BOOLEAN         NOT NULL DEFAULT FALSE,
    operation_id            UUID            NOT NULL,
    uploaded_by             UUID            NOT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP       NULL,
    CONSTRAINT fk_doc_type      FOREIGN KEY (document_type_id) REFERENCES document_types(id),
    CONSTRAINT fk_doc_operation FOREIGN KEY (operation_id)     REFERENCES operations(id),
    CONSTRAINT fk_doc_uploader  FOREIGN KEY (uploaded_by)      REFERENCES users(id)
);

-- 6. Audit log (inalterable — RN-07)
-- SIN FK intencional: sobrevive al borrado de entidades referenciadas.
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action      VARCHAR(100)    NOT NULL,
    entity_type VARCHAR(100)    NULL,
    entity_id   VARCHAR(255)    NULL,
    description TEXT            NULL,
    user_id     UUID            NULL,
    ip_address  VARCHAR(45)     NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- 7. Refresh tokens de Zitadel no se gestionan aquí (Zitadel los maneja).
-- Esta tabla es para tokens de revocación si en el futuro se necesita.
-- Por ahora Zitadel gestiona sesiones completas.

-- Índices
CREATE INDEX idx_operations_client_id   ON operations(client_id);
CREATE INDEX idx_operations_estado      ON operations(estado);
CREATE INDEX idx_operations_vencimiento ON operations(fecha_vencimiento_at) WHERE fecha_vencimiento_at IS NOT NULL;
CREATE INDEX idx_documents_operation_id ON documents(operation_id);
CREATE INDEX idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_users_zitadel_id       ON users(zitadel_user_id);
