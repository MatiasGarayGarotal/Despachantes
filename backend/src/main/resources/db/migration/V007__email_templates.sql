-- V007: Email templates table (editable por super admin)

CREATE TABLE email_templates (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    subject         TEXT         NOT NULL,
    html_body       TEXT         NOT NULL,
    variables_doc   TEXT,        -- JSON string con descripción de variables disponibles
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by_id   UUID         REFERENCES users(id) ON DELETE SET NULL
);

-- Plantilla: documento compartido con cliente
INSERT INTO email_templates (code, name, subject, html_body, variables_doc) VALUES (
'SHARE_DOCUMENT',
'Documento compartido con cliente',
'Documentación disponible - Carpeta {{carpetaNro}} | López Vener & Asoc.',
'<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Documento compartido</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ''Helvetica Neue'', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #0E3048; }
    .wrapper { max-width: 600px; margin: 40px auto; }
    .header { background-color: #0E3048; border-radius: 12px 12px 0 0; padding: 32px 40px; display: flex; align-items: center; gap: 16px; }
    .logo-box { width: 44px; height: 44px; background-color: #d89772; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo-text { color: #0E3048; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; }
    .brand-name { color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.2; }
    .brand-sub { color: #d89772; font-size: 11px; font-weight: 600; letter-spacing: 1px; margin-top: 2px; }
    .body { background: #ffffff; padding: 40px; }
    .greeting { font-size: 22px; font-weight: 700; color: #0E3048; margin-bottom: 12px; }
    .intro { font-size: 15px; color: #4a6070; line-height: 1.6; margin-bottom: 28px; }
    .doc-card { background: #f8f9fb; border: 1px solid #e5eaee; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px; }
    .doc-card-label { font-size: 10px; font-weight: 700; color: #d89772; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
    .doc-name { font-size: 16px; font-weight: 700; color: #0E3048; margin-bottom: 4px; }
    .doc-type { font-size: 13px; color: #6b8394; margin-bottom: 12px; }
    .doc-meta { display: flex; gap: 24px; flex-wrap: wrap; }
    .doc-meta-item { font-size: 12px; color: #6b8394; }
    .doc-meta-item strong { color: #0E3048; }
    .cta-wrapper { text-align: center; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background-color: #0E3048; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 16px 40px; border-radius: 10px; text-decoration: none; letter-spacing: 0.3px; }
    .cta-btn span { color: #d89772; }
    .expiry-note { background: #fffbf4; border: 1px solid #f0e0ca; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #8a5a2a; margin-bottom: 28px; }
    .expiry-note strong { color: #6b3d10; }
    .divider { border: none; border-top: 1px solid #eef0f3; margin: 28px 0; }
    .footer-note { font-size: 13px; color: #8b9faf; line-height: 1.6; }
    .footer { background: #f4f5f7; border-radius: 0 0 12px 12px; padding: 20px 40px; border-top: 1px solid #e5eaee; }
    .footer p { font-size: 11px; color: #8b9faf; text-align: center; line-height: 1.7; }
    .footer a { color: #d89772; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo-box"><span class="logo-text">LV</span></div>
      <div>
        <div class="brand-name">LÓPEZ VENER &amp; ASOC.</div>
        <div class="brand-sub">Despachante de Aduana OEC</div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hola, {{recipientName}}</p>
      <p class="intro">
        Tenés documentación disponible para descargar correspondiente a tu operación de comercio exterior.
        {{sharedBy}} compartió el siguiente documento con vos:
      </p>

      <!-- Doc card -->
      <div class="doc-card">
        <div class="doc-card-label">Documento</div>
        <div class="doc-name">{{documentName}}</div>
        <div class="doc-type">{{documentType}}</div>
        <div class="doc-meta">
          <div class="doc-meta-item"><strong>Carpeta:</strong> {{carpetaNro}}</div>
          <div class="doc-meta-item"><strong>Cliente:</strong> {{clientName}}</div>
          <div class="doc-meta-item"><strong>Compartido por:</strong> {{sharedBy}}</div>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrapper">
        <a href="{{shareUrl}}" class="cta-btn">
          Ver y descargar documento <span>→</span>
        </a>
      </div>

      <!-- Expiry -->
      <div class="expiry-note">
        ⏱ <strong>Link con vencimiento:</strong> Este link estará disponible hasta el <strong>{{expiresAt}}</strong>. Pasada esa fecha deberás solicitar uno nuevo.
      </div>

      <hr class="divider" />

      <p class="footer-note">
        Si tenés dudas sobre este documento o tu operación, no dudes en contactarnos respondiendo este correo o comunicándote directamente con tu despachante asignado.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        © López Vener &amp; Asoc. — Despachante de Aduana OEC<br/>
        Este es un correo automático, por favor no responder directamente.<br/>
        <a href="{{shareUrl}}">Ver documento</a>
      </p>
    </div>
  </div>
</body>
</html>',
'[
  {"var": "recipientName",  "desc": "Nombre del destinatario"},
  {"var": "documentName",   "desc": "Nombre del archivo"},
  {"var": "documentType",   "desc": "Tipo de documento (ej: Factura Comercial)"},
  {"var": "carpetaNro",     "desc": "Número de carpeta (ej: 2025-IMP-0001)"},
  {"var": "clientName",     "desc": "Razón social del cliente"},
  {"var": "shareUrl",       "desc": "URL del link de descarga"},
  {"var": "expiresAt",      "desc": "Fecha y hora de vencimiento del link"},
  {"var": "sharedBy",       "desc": "Nombre de quien generó el link"}
]'
);

-- Plantilla: cambio de estado de carpeta
INSERT INTO email_templates (code, name, subject, html_body, variables_doc, is_active) VALUES (
'STATUS_CHANGE',
'Actualización de estado de carpeta',
'Tu expediente {{carpetaNro}} avanzó a: {{nuevoEstado}} | López Vener',
'<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: ''Helvetica Neue'', Helvetica, Arial, sans-serif; background:#f4f5f7; color:#0E3048; }
    .wrapper { max-width:600px; margin:40px auto; }
    .header { background:#0E3048; border-radius:12px 12px 0 0; padding:32px 40px; }
    .brand-name { color:#fff; font-size:18px; font-weight:700; }
    .brand-sub { color:#d89772; font-size:11px; font-weight:600; letter-spacing:1px; margin-top:2px; }
    .body { background:#fff; padding:40px; }
    .greeting { font-size:22px; font-weight:700; margin-bottom:12px; }
    .intro { font-size:15px; color:#4a6070; line-height:1.6; margin-bottom:24px; }
    .status-badge { display:inline-block; background:#d89772; color:#0E3048; font-weight:700; font-size:14px; padding:8px 20px; border-radius:20px; margin-bottom:24px; }
    .meta { background:#f8f9fb; border:1px solid #e5eaee; border-radius:10px; padding:16px 20px; margin-bottom:28px; font-size:13px; color:#4a6070; line-height:2; }
    .meta strong { color:#0E3048; }
    .footer { background:#f4f5f7; border-radius:0 0 12px 12px; padding:20px 40px; border-top:1px solid #e5eaee; }
    .footer p { font-size:11px; color:#8b9faf; text-align:center; line-height:1.7; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-name">LÓPEZ VENER &amp; ASOC.</div>
      <div class="brand-sub">Despachante de Aduana OEC</div>
    </div>
    <div class="body">
      <p class="greeting">Hola, {{recipientName}}</p>
      <p class="intro">Tu expediente avanzó a una nueva etapa:</p>
      <div class="status-badge">{{nuevoEstado}}</div>
      <div class="meta">
        <div><strong>Carpeta:</strong> {{carpetaNro}}</div>
        <div><strong>Cliente:</strong> {{clientName}}</div>
        <div><strong>Actualizado por:</strong> {{updatedBy}}</div>
        <div><strong>Fecha:</strong> {{updatedAt}}</div>
      </div>
      <p style="font-size:13px;color:#8b9faf;">Ante cualquier consulta podés contactarte con tu despachante asignado.</p>
    </div>
    <div class="footer">
      <p>© López Vener &amp; Asoc. — Despachante de Aduana OEC</p>
    </div>
  </div>
</body>
</html>',
'[
  {"var": "recipientName", "desc": "Nombre del destinatario"},
  {"var": "carpetaNro",    "desc": "Número de carpeta"},
  {"var": "clientName",    "desc": "Razón social del cliente"},
  {"var": "nuevoEstado",   "desc": "Nuevo estado (ej: Levante)"},
  {"var": "updatedBy",     "desc": "Nombre de quien actualizó el estado"},
  {"var": "updatedAt",     "desc": "Fecha y hora del cambio"}
]',
FALSE  -- inactiva hasta implementar
);
