-- =============================================================
-- V009: Actualización tipos de documentos según configuración del cliente
-- - Agrega campo expiry_hint para mostrar ayuda contextual
-- - Elimina 7 tipos no utilizados (y sus documentos/shares)
-- - Actualiza los 6 tipos definitivos con datos correctos
-- =============================================================

-- 1. Agregar columna expiry_hint
ALTER TABLE document_types
    ADD COLUMN expiry_hint VARCHAR(255) NULL;

-- 2. Eliminar shares de documentos que referencian tipos a borrar
DELETE FROM document_shares
WHERE document_id IN (
    SELECT d.id FROM documents d
    JOIN document_types dt ON d.document_type_id = dt.id
    WHERE dt.code IN ('POLIZA_SEGURO','MIC_DTA','CERT_FITOSANITARIO','CERT_ZOOSANITARIO','LICENCIA_IMP','ANALISIS_LAB','CERT_CE_FDA')
);

-- 3. Eliminar documentos que referencian tipos a borrar
DELETE FROM documents
WHERE document_type_id IN (
    SELECT id FROM document_types
    WHERE code IN ('POLIZA_SEGURO','MIC_DTA','CERT_FITOSANITARIO','CERT_ZOOSANITARIO','LICENCIA_IMP','ANALISIS_LAB','CERT_CE_FDA')
);

-- 4. Eliminar los 7 tipos no utilizados
DELETE FROM document_types
WHERE code IN ('POLIZA_SEGURO','MIC_DTA','CERT_FITOSANITARIO','CERT_ZOOSANITARIO','LICENCIA_IMP','ANALISIS_LAB','CERT_CE_FDA');

-- 5. Actualizar los 6 tipos definitivos con la configuración correcta

-- Factura Comercial: opcional, aplica a ambas operaciones, todas las vías
UPDATE document_types SET
    name                = 'Factura Comercial',
    description         = 'Commercial Invoice — detalla mercadería y valor de la transacción',
    applies_to          = 'AMBAS',
    via_transporte      = 'TODAS',
    is_always_required  = FALSE,
    has_expiration      = FALSE,
    expiry_hint         = NULL
WHERE code = 'FACTURA_COMERCIAL';

-- Packing List: opcional, aplica a ambas operaciones, todas las vías
UPDATE document_types SET
    name                = 'Packing List',
    description         = 'Detalle de bultos, pesos y medidas. Conveniente pero no obligatorio.',
    applies_to          = 'AMBAS',
    via_transporte      = 'TODAS',
    is_always_required  = FALSE,
    has_expiration      = FALSE,
    expiry_hint         = NULL
WHERE code = 'PACKING_LIST';

-- BL: obligatorio cuando la vía es marítima, aplica a ambas operaciones
UPDATE document_types SET
    name                = 'Bill of Lading (BL)',
    description         = 'Documento de embarque marítimo (original o telex release)',
    applies_to          = 'AMBAS',
    via_transporte      = 'MARITIMA',
    is_always_required  = TRUE,
    has_expiration      = FALSE,
    expiry_hint         = NULL
WHERE code = 'BL';

-- CRT: obligatorio cuando la vía es terrestre, aplica a ambas operaciones
UPDATE document_types SET
    name                = 'CRT - Carta de Porte Internacional',
    description         = 'Documento de transporte terrestre internacional',
    applies_to          = 'AMBAS',
    via_transporte      = 'TERRESTRE',
    is_always_required  = TRUE,
    has_expiration      = FALSE,
    expiry_hint         = NULL
WHERE code = 'CRT';

-- AWB: obligatorio cuando la vía es aérea, aplica a ambas operaciones
UPDATE document_types SET
    name                = 'Air Waybill (AWB)',
    description         = 'Documento de transporte aéreo internacional',
    applies_to          = 'AMBAS',
    via_transporte      = 'AEREA',
    is_always_required  = TRUE,
    has_expiration      = FALSE,
    expiry_hint         = NULL
WHERE code = 'AWB';

-- Certificado de Origen: opcional, vence a 180 días desde emisión
UPDATE document_types SET
    name                = 'Certificado de Origen',
    description         = 'Para aplicar beneficios arancelarios (MERCOSUR, acuerdos comerciales)',
    applies_to          = 'AMBAS',
    via_transporte      = 'TODAS',
    is_always_required  = FALSE,
    has_expiration      = TRUE,
    expiry_hint         = '180 días desde emisión'
WHERE code = 'CERT_ORIGEN';
