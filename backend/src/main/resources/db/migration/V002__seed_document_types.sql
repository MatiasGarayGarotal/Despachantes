-- =============================================================
-- V002: Tipos de documentos iniciales (datos maestros)
-- =============================================================
-- Fuente: domain-expert-despachantes — documentos por vía de transporte
-- Pendiente de confirmar con Gabriel: reglas de obligatoriedad exactas
-- =============================================================

-- Documentos requeridos para CUALQUIER operación (cualquier vía)
INSERT INTO document_types (code, name, description, applies_to, via_transporte, is_always_required) VALUES
    ('FACTURA_COMERCIAL', 'Factura Comercial', 'Commercial Invoice — detalla mercadería y valor', 'AMBAS', 'TODAS', TRUE),
    ('PACKING_LIST',      'Packing List',      'Detalle de bultos, pesos y medidas',              'AMBAS', 'TODAS', TRUE);

-- Importación Marítima
INSERT INTO document_types (code, name, description, applies_to, via_transporte, is_always_required) VALUES
    ('BL',             'Bill of Lading',            'Documento de embarque marítimo (original o telex release)', 'IMPORTACION', 'MARITIMA', TRUE),
    ('POLIZA_SEGURO',  'Póliza de Seguro',           'Seguro de la carga marítima',                               'IMPORTACION', 'MARITIMA', TRUE);

-- Importación Terrestre
INSERT INTO document_types (code, name, description, applies_to, via_transporte, is_always_required) VALUES
    ('CRT',    'CRT - Carta de Porte Internacional', 'Documento de transporte terrestre internacional', 'IMPORTACION', 'TERRESTRE', TRUE),
    ('MIC_DTA','MIC/DTA',                            'Manifiesto Internacional de Carga',               'IMPORTACION', 'TERRESTRE', TRUE);

-- Importación Aérea
INSERT INTO document_types (code, name, description, applies_to, via_transporte, is_always_required) VALUES
    ('AWB', 'Air Waybill', 'Documento de transporte aéreo', 'IMPORTACION', 'AEREA', TRUE);

-- Documentos condicionales (según el producto o acuerdo comercial)
INSERT INTO document_types (code, name, description, applies_to, via_transporte, is_always_required) VALUES
    ('CERT_ORIGEN',       'Certificado de Origen',           'Para beneficios arancelarios (MERCOSUR, etc.)',           'AMBAS',       'TODAS', FALSE),
    ('CERT_FITOSANITARIO','Certificado Fitosanitario',        'Para productos agropecuarios — vegetal',                  'IMPORTACION', 'TODAS', FALSE),
    ('CERT_ZOOSANITARIO', 'Certificado Zoosanitario',        'Para productos agropecuarios — animal',                   'IMPORTACION', 'TODAS', FALSE),
    ('LICENCIA_IMP',      'Licencia de Importación',         'Para productos controlados que la requieren',             'IMPORTACION', 'TODAS', FALSE),
    ('ANALISIS_LAB',      'Análisis de Laboratorio',         'Para alimentos, medicamentos, productos regulados',       'IMPORTACION', 'TODAS', FALSE),
    ('CERT_CE_FDA',       'Certificado CE / FDA',            'Para productos con regulación en origen',                 'IMPORTACION', 'TODAS', FALSE);
