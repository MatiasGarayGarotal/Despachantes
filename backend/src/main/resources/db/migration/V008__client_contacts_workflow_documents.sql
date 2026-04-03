-- =============================================================
-- V008: Clientes extendidos + Contactos + Workflow States + Documentos
-- =============================================================
-- Cambios:
--   1. clients: tipo_persona, tipo_documento, numero_documento (renombra rut),
--               localidad, mega_numero
--   2. document_types: has_expiration + correcciones de Gabriel (Bloque 4)
--   3. documents: expiration_date, description
--   4. workflow_states: tabla maestra de estados por tipo de operación
--   5. contact_types: tipos de contacto configurables
--   6. contacts: contactos por cliente
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CLIENTES — nuevos campos
-- ─────────────────────────────────────────────────────────────

-- Renombrar rut → numero_documento (el constraint unique se mantiene)
ALTER TABLE clients RENAME COLUMN rut TO numero_documento;

-- Tipo de persona: EMPRESA (RUT) o FISICA (CI)
ALTER TABLE clients
    ADD COLUMN tipo_persona   VARCHAR(10) NOT NULL DEFAULT 'EMPRESA',
    ADD COLUMN tipo_documento VARCHAR(5)  NOT NULL DEFAULT 'RUT',
    ADD COLUMN localidad      VARCHAR(100) NULL,
    ADD COLUMN mega_numero    VARCHAR(50)  NULL;

COMMENT ON COLUMN clients.tipo_persona   IS 'EMPRESA | FISICA';
COMMENT ON COLUMN clients.tipo_documento IS 'RUT | CI';
COMMENT ON COLUMN clients.mega_numero    IS 'Número interno de cliente en Mega 6 (opcional)';

-- ─────────────────────────────────────────────────────────────
-- 2. TIPOS DE DOCUMENTOS — agregar has_expiration
--    y corregir datos según respuestas de Gabriel (Bloque 4)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE document_types
    ADD COLUMN has_expiration BOOLEAN NOT NULL DEFAULT FALSE;

-- Factura Comercial: Gabriel dijo NO obligatorio siempre, SÍ vence
UPDATE document_types SET is_always_required = FALSE, has_expiration = TRUE
    WHERE code = 'FACTURA_COMERCIAL';

-- Packing List: no obligatorio, sin vencimiento, aplica a ambas
UPDATE document_types SET is_always_required = FALSE, has_expiration = FALSE, applies_to = 'AMBAS'
    WHERE code = 'PACKING_LIST';

-- BL: obligatorio, sin vencimiento, aplica a AMBAS (exportación marítima también)
UPDATE document_types SET is_always_required = TRUE, has_expiration = FALSE, applies_to = 'AMBAS'
    WHERE code = 'BL';

-- CRT: obligatorio, sin vencimiento, aplica a AMBAS (terrestre)
UPDATE document_types SET is_always_required = TRUE, has_expiration = FALSE, applies_to = 'AMBAS'
    WHERE code = 'CRT';

-- AWB: obligatorio, sin vencimiento, aplica a AMBAS (aérea)
UPDATE document_types SET is_always_required = TRUE, has_expiration = FALSE, applies_to = 'AMBAS'
    WHERE code = 'AWB';

-- Certificado de Origen: no obligatorio siempre, SÍ vence (180 días)
UPDATE document_types SET is_always_required = FALSE, has_expiration = TRUE
    WHERE code = 'CERT_ORIGEN';

-- ─────────────────────────────────────────────────────────────
-- 3. DOCUMENTOS — fecha de vencimiento y descripción
-- ─────────────────────────────────────────────────────────────

ALTER TABLE documents
    ADD COLUMN expiration_date DATE         NULL,
    ADD COLUMN description     VARCHAR(255) NULL;

COMMENT ON COLUMN documents.expiration_date IS 'Solo se carga si el tipo de documento tiene has_expiration=true';
COMMENT ON COLUMN documents.description     IS 'Descripción libre para documentos extras sin tipo';

-- ─────────────────────────────────────────────────────────────
-- 4. WORKFLOW STATES — estados configurables por tipo de operación
-- ─────────────────────────────────────────────────────────────

CREATE TABLE workflow_states (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(20) NOT NULL,          -- IMPORTACION | EXPORTACION | TRANSITO
    step_order     INT         NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workflow_type_order UNIQUE (operation_type, step_order),
    CONSTRAINT uq_workflow_type_code  UNIQUE (operation_type, code)
);

COMMENT ON TABLE workflow_states IS 'Estados del workflow por tipo de operación. Editables desde Configuración.';

-- ─────────────────────────────────────────────────────────────
-- 5. TIPOS DE CONTACTO — catálogo configurable
-- ─────────────────────────────────────────────────────────────

CREATE TABLE contact_types (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT        NULL,
    sort_order  INT         NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. CONTACTOS — múltiples contactos por cliente
-- ─────────────────────────────────────────────────────────────

CREATE TABLE contacts (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id               UUID        NOT NULL,
    contact_type_id         UUID        NULL,         -- NULL cuando es "Otro" sin tipo estándar
    nombre                  VARCHAR(255) NOT NULL,
    cargo                   VARCHAR(100) NULL,
    telefono                VARCHAR(50)  NULL,
    email                   VARCHAR(255) NULL,
    receives_notifications  BOOLEAN     NOT NULL DEFAULT FALSE,
    notas                   TEXT        NULL,
    sort_order              INT         NOT NULL DEFAULT 0,
    created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP   NULL,
    CONSTRAINT fk_contact_client FOREIGN KEY (client_id)        REFERENCES clients(id),
    CONSTRAINT fk_contact_type   FOREIGN KEY (contact_type_id)  REFERENCES contact_types(id)
);

CREATE INDEX idx_contacts_client_id ON contacts(client_id);

-- ─────────────────────────────────────────────────────────────
-- SEED: Tipos de contacto iniciales
-- ─────────────────────────────────────────────────────────────

INSERT INTO contact_types (code, name, description, sort_order) VALUES
    ('RESPONSABLE_PRINCIPAL',   'Responsable Principal',          'Interlocutor general del cliente. Recibe la mayoría de notificaciones.', 1),
    ('ENCARGADO_DEPOSITO',      'Encargado de Depósito',          'Gestiona la logística y el retiro físico de la mercadería.',             2),
    ('CONTADORA',               'Contadora / Administración',     'Gestiona pagos y recibe las liquidaciones de gastos.',                   3),
    ('GERENTE',                 'Gerente / Dueño',                'Recibe alertas críticas y resúmenes ejecutivos.',                        4),
    ('CONTACTO_EXPORTACION',    'Contacto de Exportación',        'Específico para operaciones de exportación.',                            5),
    ('OTRO',                    'Otro',                           'Contacto con rol personalizado.',                                        6);

-- ─────────────────────────────────────────────────────────────
-- SEED: Workflow states — Importación (10 estados)
-- ─────────────────────────────────────────────────────────────

INSERT INTO workflow_states (operation_type, step_order, code, name) VALUES
    ('IMPORTACION', 1,  'APERTURA',                  'Apertura'),
    ('IMPORTACION', 2,  'DOCUMENTACION_EN_PROCESO',  'Documentación en Proceso'),
    ('IMPORTACION', 3,  'DOCUMENTACION_COMPLETA',    'Documentación Completa'),
    ('IMPORTACION', 4,  'NUMERADO',                  'Numerado (DUA asignado)'),
    ('IMPORTACION', 5,  'CANAL_ASIGNADO',            'Canal Asignado'),
    ('IMPORTACION', 6,  'EN_DEPOSITO',               'En Depósito / Puerto'),
    ('IMPORTACION', 7,  'LEVANTE',                   'Levante'),
    ('IMPORTACION', 8,  'RETIRADO',                  'Retirado'),
    ('IMPORTACION', 9,  'FACTURADO',                 'Facturado'),
    ('IMPORTACION', 10, 'CERRADO',                   'Cerrado');

-- ─────────────────────────────────────────────────────────────
-- SEED: Workflow states — Exportación (10 estados)
-- Incluye INGRESO_PUERTO entre NUMERADO y CANAL_ASIGNADO (pedido de Gabriel)
-- ─────────────────────────────────────────────────────────────

INSERT INTO workflow_states (operation_type, step_order, code, name) VALUES
    ('EXPORTACION', 1,  'APERTURA',                  'Apertura'),
    ('EXPORTACION', 2,  'DOCUMENTACION_EN_PROCESO',  'Documentación en Proceso'),
    ('EXPORTACION', 3,  'DOCUMENTACION_COMPLETA',    'Documentación Completa'),
    ('EXPORTACION', 4,  'NUMERADO',                  'Numerado (DUA asignado)'),
    ('EXPORTACION', 5,  'INGRESO_PUERTO',             'Ingreso de Mercadería a Puerto'),
    ('EXPORTACION', 6,  'CANAL_ASIGNADO',            'Canal Asignado'),
    ('EXPORTACION', 7,  'EN_DEPOSITO',               'En Depósito / Puerto'),
    ('EXPORTACION', 8,  'LEVANTE',                   'Levante / Embarque'),
    ('EXPORTACION', 9,  'FACTURADO',                 'Facturado'),
    ('EXPORTACION', 10, 'CERRADO',                   'Cerrado');

-- ─────────────────────────────────────────────────────────────
-- SEED: Workflow states — Tránsito (mismo que Importación por ahora)
-- Pendiente confirmación final de Gabriel
-- ─────────────────────────────────────────────────────────────

INSERT INTO workflow_states (operation_type, step_order, code, name) VALUES
    ('TRANSITO', 1,  'APERTURA',                  'Apertura'),
    ('TRANSITO', 2,  'DOCUMENTACION_EN_PROCESO',  'Documentación en Proceso'),
    ('TRANSITO', 3,  'DOCUMENTACION_COMPLETA',    'Documentación Completa'),
    ('TRANSITO', 4,  'NUMERADO',                  'Numerado (DUA asignado)'),
    ('TRANSITO', 5,  'CANAL_ASIGNADO',            'Canal Asignado'),
    ('TRANSITO', 6,  'EN_DEPOSITO',               'En Depósito / Puerto'),
    ('TRANSITO', 7,  'LEVANTE',                   'Levante'),
    ('TRANSITO', 8,  'RETIRADO',                  'Retirado'),
    ('TRANSITO', 9,  'FACTURADO',                 'Facturado'),
    ('TRANSITO', 10, 'CERRADO',                   'Cerrado');
