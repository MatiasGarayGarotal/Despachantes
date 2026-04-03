-- =============================================================
-- V006: Configuración del sistema + tokens de compartir documentos
-- =============================================================

-- 1. Parámetros de configuración del sistema
CREATE TABLE system_config (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(100)    NOT NULL UNIQUE,
    value       TEXT            NOT NULL,
    description TEXT            NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Parámetros iniciales
INSERT INTO system_config (key, value, description) VALUES
    ('share_link_expiry_days', '7',   'Días de vigencia del link de compartir documentos'),
    ('share_link_base_url',    '',    'URL base para links públicos (vacío = usa la URL del servidor)');

-- 2. Tokens de links compartidos de documentos
CREATE TABLE document_shares (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(64)     NOT NULL UNIQUE,
    document_id UUID            NOT NULL,
    expires_at  TIMESTAMP       NOT NULL,
    created_by  UUID            NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMP       NULL,
    CONSTRAINT fk_share_document    FOREIGN KEY (document_id) REFERENCES documents(id),
    CONSTRAINT fk_share_created_by  FOREIGN KEY (created_by)  REFERENCES users(id)
);

CREATE INDEX idx_document_shares_token       ON document_shares(token);
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
