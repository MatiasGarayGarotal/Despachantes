#!/usr/bin/env node
/**
 * setup-zitadel-branding.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configura el branding visual y los textos del login de Zitadel v2.67
 * para el proyecto Despachantes López Vener & Asoc.
 *
 * Uso:     node scripts/setup-zitadel-branding.js
 *   o:     npm run setup:zitadel   (desde la raíz del proyecto)
 *
 * Prerequisitos:
 *   1. Variables definidas en .env:
 *        ZITADEL_ISSUER_URI            → ej. http://localhost:8080
 *        ZITADEL_MACHINE_TOKEN_DESIGN  → PAT del Service Account (rol "Org Owner")
 *        ZITADEL_ORG_ID                → ID de la organización
 *   2. Node.js >= 18 (fetch nativo incluido)
 *
 * El script usa el patrón LEER-MODIFICAR-GUARDAR (Read-Modify-Write):
 *   Antes de modificar cualquier política, hace un GET para leer el estado
 *   actual completo, aplica solo los cambios necesarios sobre ese objeto,
 *   y luego lo guarda. Esto garantiza que no se destruyen flags existentes.
 *
 * Nota — Logo y Fuente: se configuran manualmente desde la consola de Zitadel:
 *   Console → Org → Branding → Logo / Font
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Verificar versión de Node ─────────────────────────────────────────────────
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
    console.error('[ERROR] Se requiere Node.js >= 18 para usar fetch nativo.');
    console.error(`        Versión actual: ${process.versions.node}`);
    process.exit(1);
}

// ── Cargar .env desde la raíz del proyecto ────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] No se encontró .env en: ${filePath}`);
        console.error('        Copiá .env.example a .env y completá las variables de Zitadel.');
        process.exit(1);
    }
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
        if (key && !(key in process.env)) process.env[key] = val;
    }
}

loadEnv(ENV_PATH);

// ── Leer y validar variables ──────────────────────────────────────────────────
const BASE_URL = process.env.ZITADEL_ISSUER_URI?.replace(/\/$/, '');
const TOKEN    = process.env.ZITADEL_MACHINE_TOKEN_DESIGN;
const ORG_ID   = process.env.ZITADEL_ORG_ID;

const missing = [];
if (!BASE_URL) missing.push('ZITADEL_ISSUER_URI');
if (!TOKEN)    missing.push('ZITADEL_MACHINE_TOKEN_DESIGN');
if (!ORG_ID)   missing.push('ZITADEL_ORG_ID');

if (missing.length) {
    console.error(`[ERROR] Variables de entorno vacías: ${missing.join(', ')}`);
    console.error('        Completalas en el archivo .env del proyecto.');
    process.exit(1);
}

// ── Paleta de colores — ui-system.md ─────────────────────────────────────────
const BRAND = {
    navy:   '#0E3048',  // botones primarios, texto sobre fondo claro
    gold:   '#B18F5B',  // acentos en dark mode
    accent: '#E67E22',  // alertas/warn
    white:  '#FFFFFF',  // texto sobre fondos oscuros
    slate:  '#F0F2F5',  // fondo canvas del login (light mode)
};

const LANG = 'es';  // idioma de los custom texts

// ── Helper HTTP ───────────────────────────────────────────────────────────────
async function apiRequest(method, endpoint, body = null) {
    const url  = `${BASE_URL}${endpoint}`;
    const opts = {
        method,
        headers: {
            'Authorization':   `Bearer ${TOKEN}`,
            'Content-Type':    'application/json',
            'Accept':          'application/json',
            'x-zitadel-orgid': ORG_ID,
        },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    let res;
    try {
        res = await fetch(url, opts);
    } catch (netErr) {
        throw Object.assign(
            new Error(`Error de red al conectar con Zitadel (${url}): ${netErr.message}`),
            { type: 'NETWORK' }
        );
    }

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { _raw: text }; }

    if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${res.statusText} — ${method} ${endpoint}`);
        err.status = res.status;
        err.body   = json;
        err.type   = 'API';
        throw err;
    }

    return json;
}

// ── Detecta el error "no hubo cambios" (idempotencia de Zitadel) ──────────────
// Zitadel v2.67 usa dos variantes según el recurso:
//   "Private Label Policy has not been changed"  → contains "not been changed"
//   "Errors.Org.LoginPolicy.NotChanged"          → contains "notchanged"
function isNotChangedError(body) {
    if (!body) return false;
    const msg = (body.message || '').toLowerCase();
    return body.code === 9 && (
        msg.includes('not been changed') ||
        msg.includes('notchanged') ||
        msg.includes('not changed')
    );
}

// ── Elimina campos de metadatos que Zitadel agrega en los GET ────────────────
// Estos campos no deben enviarse de vuelta en POST/PUT o Zitadel los rechaza.
function stripMeta(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const metaKeys = new Set([
        'details', 'isDefault', 'resourceOwner',
        'sequence', 'creationDate', 'changeDate', 'id',
    ]);
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !metaKeys.has(k))
    );
}

// ── Patrón READ-MODIFY-WRITE (seguro) ────────────────────────────────────────
// 1. GET el estado actual completo de la política
// 2. Aplicar solo los overrides necesarios sobre ese estado
// 3. POST (crear) si no existe custom policy aún, PUT (actualizar) si ya existe
//
// Esto garantiza que no destruimos flags ni configuraciones que no tocamos.
async function readThenPatch(policyPath, overrides) {
    // 1. Leer estado actual (siempre devuelve 200 aunque sea el default de instancia)
    const getRes   = await apiRequest('GET', policyPath);
    const current  = getRes.policy || getRes;
    const isDefault = current.isDefault ?? true;

    // 2. Patch: mantener todo lo existente, pisar solo lo que especificamos
    const payload = { ...stripMeta(current), ...overrides };

    // 3. Escribir: POST si no hay custom policy, PUT si ya existe
    const method = isDefault ? 'POST' : 'PUT';
    try {
        await apiRequest(method, policyPath, payload);
        return { method, updated: true };
    } catch (writeErr) {
        // Idempotente: sin cambios → OK
        if (writeErr.status === 400 && isNotChangedError(writeErr.body)) {
            return { method, alreadyUpToDate: true };
        }
        // POST rechazado porque ya existía (race condition) → reintentar con PUT
        if (method === 'POST' && (writeErr.status === 409 || writeErr.body?.code === 6)) {
            try {
                await apiRequest('PUT', policyPath, payload);
                return { method: 'PUT', updated: true };
            } catch (putErr) {
                if (putErr.status === 400 && isNotChangedError(putErr.body)) {
                    return { method: 'PUT', alreadyUpToDate: true };
                }
                throw putErr;
            }
        }
        throw writeErr;
    }
}

// ── Logging ───────────────────────────────────────────────────────────────────
const c = {
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
};

function ok(step, msg)   { console.log(`  ${c.green}✅${c.reset} [${c.bold}${step}${c.reset}] ${msg}`); }
function warn(step, msg) { console.warn(`  ${c.yellow}⚠️ ${c.reset} [${c.bold}${step}${c.reset}] ${msg}`); }
function fail(step, msg) { console.error(`  ${c.red}❌${c.reset} [${c.bold}${step}${c.reset}] ${msg}`); }
function info(msg)       { console.log(`  ${c.cyan}ℹ️ ${c.reset} ${msg}`); }

// ═════════════════════════════════════════════════════════════════════════════
// PASO 1 — Label Policy: Colores de marca (Read-Modify-Write)
//
// Endpoint GET:  GET /management/v1/policies/label
// Endpoint SAVE: POST o PUT /management/v1/policies/label
// Endpoint ACT:  POST /management/v1/policies/label/_activate
//
// Solo se pisan los campos de color. Todas las demás flags (hideLoginNameSuffix,
// errorMsgPopup, etc.) se conservan tal como están en Zitadel.
//
// IMPORTANTE: los cambios quedan en estado "draft" hasta la activación.
// ═════════════════════════════════════════════════════════════════════════════
async function applyLabelPolicy() {
    const STEP = 'LabelPolicy';
    console.log(`\n── Paso 1: Colores de marca (Label Policy) ${'─'.repeat(28)}`);

    // Solo estos campos de color + watermark se tocan. El resto se preserva del GET.
    const colorOverrides = {
        primaryColor:        BRAND.navy,   // botones, links activos (light mode)
        warnColor:           BRAND.accent, // advertencias / errores
        backgroundColor:     BRAND.slate,  // fondo canvas del formulario (light)
        fontColor:           BRAND.navy,   // texto principal sobre fondo claro

        primaryColorDark:    BRAND.gold,   // botones gold en dark mode
        warnColorDark:       BRAND.accent,
        backgroundColorDark: BRAND.navy,
        fontColorDark:       BRAND.white,

        disableWatermark:    true,         // quita "Secured by ZITADEL"
    };

    const result = await readThenPatch('/management/v1/policies/label', colorOverrides);
    if (result.alreadyUpToDate) {
        ok(STEP, `Sin cambios de color (ya configurados) → BG: ${BRAND.slate} · Primary: ${BRAND.navy}`);
    } else {
        ok(STEP, `Colores guardados (${result.method}) → BG: ${BRAND.slate} · Primary: ${BRAND.navy}`);
    }

    // ── Activar los cambios (publicar draft) ──────────────────────────────────
    // Sin este paso los colores quedan en draft y los usuarios no los ven.
    try {
        await apiRequest('POST', '/management/v1/policies/label/_activate');
        ok(STEP, 'Colores activados (publicados).');
    } catch (activateErr) {
        if (activateErr.status === 400 && isNotChangedError(activateErr.body)) {
            ok(STEP, 'Colores ya estaban activos (sin draft pendiente).');
        } else {
            throw activateErr;
        }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// PASO 2 — Login Policy: Garantizar allowUsernamePassword (Read-Modify-Write)
//
// Endpoint GET:  GET /management/v1/policies/login
// Endpoint SAVE: POST o PUT /management/v1/policies/login
//
// Se pisa ÚNICAMENTE allowUsernamePassword: true.
// Todos los demás flags (MFA, SSO, registro, reset de contraseña, etc.)
// se mantienen exactamente como están en Zitadel — sin tocarlos.
//
// Esto evita que un payload incompleto sobrescriba y rompa el flujo de auth.
// ═════════════════════════════════════════════════════════════════════════════
async function applyLoginPolicy() {
    const STEP = 'LoginPolicy';
    console.log(`\n── Paso 2: Política de login (allowUsernamePassword) ${'─'.repeat(19)}`);

    // Solo garantizamos este flag. Lo demás se preserva del GET.
    const result = await readThenPatch('/management/v1/policies/login', {
        allowUsernamePassword: true,
    });

    if (result.alreadyUpToDate) {
        ok(STEP, 'allowUsernamePassword ya estaba en true — sin cambios.');
    } else {
        ok(STEP, `allowUsernamePassword forzado a true (${result.method}). Botón de ingreso habilitado.`);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// PASO 3 — Custom Login Texts: Textos en Español
//
// Endpoint: PUT /management/v1/text/login/{language}   (singular /text/)
//
// Este endpoint reemplaza TODOS los textos del idioma de una vez.
// No existe un GET-then-PUT necesario aquí: el PUT siempre es idempotente
// y no afecta la política de seguridad (es solo UI strings).
// ═════════════════════════════════════════════════════════════════════════════
async function applyCustomTexts() {
    const STEP = 'CustomTexts';
    console.log(`\n── Paso 3: Textos personalizados en "${LANG}" ${'─'.repeat(28)}`);

    // Nombres de campo confirmados contra GET /management/v1/text/login/es
    // y proto/zitadel/text.proto del repo de Zitadel v2.67.
    const payload = {
        // ── Pantalla de login (ingreso del email/usuario) ─────────────────
        loginText: {
            title:              'Portal Despachantes Lopez Vener & Asoc',
            description:        'Ingresá con tu cuenta institucional',
            loginNameLabel:     'Correo Electrónico',
            registerButtonText: '',    // vacío → no aparece botón de registro
            nextButtonText:     'Ingresar al Sistema',
        },

        // ── Pantalla de contraseña ────────────────────────────────────────
        passwordText: {
            title:          'Ingresá tu contraseña',
            description:    '',
            passwordLabel:  'Contraseña',
            resetLinkText:  'Olvidé mi contraseña',
            backButtonText: 'Volver',
            nextButtonText: 'Ingresar al Sistema',
        },

        // ── Selección de cuenta (múltiples sesiones activas) ──────────────
        selectAccountText: {
            title:       'Elegí tu cuenta',
            description: 'Usá una cuenta existente o ingresá con otra',
            otherUser:   'Usar otra cuenta',
        },

        // ── Inicializar contraseña (primer login tras creación de usuario) ─
        initPasswordText: {
            title:                   'Establecé tu contraseña',
            description:             'Creá una contraseña segura para tu cuenta',
            codeLabel:               'Código de verificación',
            newPasswordLabel:        'Nueva contraseña',
            newPasswordConfirmLabel: 'Confirmar contraseña',
            nextButtonText:          'Confirmar',
            resendButtonText:        'Reenviar código',
        },

        // ── Verificación de email ─────────────────────────────────────────
        emailVerificationText: {
            title:            'Verificá tu correo electrónico',
            description:      'Ingresá el código que enviamos a tu correo.',
            codeLabel:        'Código de verificación',
            nextButtonText:   'Verificar',
            resendButtonText: 'Reenviar código',
        },

        // ── Usuario externo no encontrado ─────────────────────────────────
        externalUserNotFoundText: {
            title:         'Usuario no encontrado',
            description:   'No existe una cuenta asociada a este correo electrónico.',
            primaryButton: 'Volver al inicio',
        },

        // ── Footer (vacíos = no se muestran) ──────────────────────────────
        footerText: {
            tosLinkText:           '',
            privacyPolicyLinkText: '',
            helpLinkText:          '',
        },
    };

    try {
        await apiRequest('PUT', `/management/v1/text/login/${LANG}`, payload);
        ok(STEP, `Textos en "${LANG}" aplicados.`);
        info(`    Título → "${payload.loginText.title}"`);
        info(`    Botón  → "${payload.loginText.nextButtonText}"`);
        info(`    Email  → "${payload.loginText.loginNameLabel}"`);
    } catch (err) {
        // PUT de textos devuelve 400 "not changed" cuando son idénticos → OK
        if (err.status === 400 && isNotChangedError(err.body)) {
            ok(STEP, `Textos en "${LANG}" sin cambios (ya configurados).`);
        } else {
            throw err;
        }
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
    console.log('\n' + c.bold + c.cyan);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   Zitadel Branding Setup — López Vener & Asoc  v2.67        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(c.reset);
    console.log(`  Servidor : ${c.cyan}${BASE_URL}${c.reset}`);
    console.log(`  Org ID   : ${c.cyan}${ORG_ID}${c.reset}`);
    console.log(`  Estrategia: ${c.cyan}Read-Modify-Write (seguro)${c.reset}`);
    console.log(`  Logo/Font : subir manualmente en Console → Org → Branding\n`);

    const steps = [
        { name: 'Label Policy (colores)',       fn: applyLabelPolicy },
        { name: 'Login Policy (username/pass)', fn: applyLoginPolicy },
        { name: `Custom Texts (${LANG})`,       fn: applyCustomTexts },
    ];

    let passed = 0;
    let failed = 0;

    for (const step of steps) {
        try {
            await step.fn();
            passed++;
        } catch (err) {
            failed++;
            fail('main', `Paso "${step.name}" falló.`);

            if (err.type === 'NETWORK') {
                console.error(`\n      ${c.red}Causa:${c.reset} ${err.message}`);
                console.error(`      Verificá que Zitadel esté corriendo en ${BASE_URL}`);
                console.error('      (docker compose up -d zitadel)\n');
            } else if (!err.type) {
                console.error(`\n      ${c.red}Error interno:${c.reset} ${err.message}`);
                if (process.env.DEBUG) console.error(err.stack);
                console.error('');
            } else if (err.type === 'API') {
                console.error(`\n      ${c.red}HTTP ${err.status}${c.reset} — Respuesta de Zitadel:`);
                console.error('      ' + JSON.stringify(err.body, null, 2).replace(/\n/g, '\n      '));
                if (err.status === 401) {
                    console.error(`\n      ${c.yellow}→ Verificá que ZITADEL_MACHINE_TOKEN_DESIGN sea válido y no haya expirado.${c.reset}`);
                } else if (err.status === 403) {
                    console.error(`\n      ${c.yellow}→ El Service Account necesita el rol "Org Owner" o "IAM Owner".${c.reset}`);
                } else if (err.status === 404) {
                    console.error(`\n      ${c.yellow}→ Verificá que ZITADEL_ORG_ID sea correcto.${c.reset}`);
                }
                console.error('');
            }

            warn('main', 'Continuando con los pasos restantes...');
        }
    }

    // ── Resumen final ─────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(66));
    if (failed === 0) {
        console.log(`\n  ${c.green}${c.bold}🎉 Configuración completa: ${passed}/${steps.length} pasos exitosos.${c.reset}`);
        console.log(`\n  Abrí ${c.cyan}${BASE_URL}${c.reset} en el navegador para verificar el login.`);
        console.log(`  El script es idempotente — podés volver a ejecutarlo sin efectos secundarios.\n`);
    } else {
        console.log(`\n  ${c.yellow}${c.bold}⚠️  ${passed}/${steps.length} pasos exitosos, ${failed} con errores.${c.reset}`);
        console.log('\n  Revisá los errores arriba y volvé a ejecutar el script.\n');
        process.exit(1);
    }
}

main().catch(err => {
    console.error(`\n${c.red}[FATAL]${c.reset} Error inesperado: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
});
