#!/usr/bin/env node
/**
 * rollback-zitadel.js — EMERGENCY ROLLBACK
 * ─────────────────────────────────────────────────────────────────────────────
 * Resetea la organización Zitadel a los defaults de la instancia eliminando
 * las custom policies y custom texts que puedan haber dejado la UI rota.
 *
 * Uso:     node scripts/rollback-zitadel.js
 *   o:     npm run rollback:zitadel
 *
 * Requiere ZITADEL_MACHINE_TOKEN_DESIGN (rol Org Owner) en .env
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
    console.error('[ERROR] Se requiere Node.js >= 18.'); process.exit(1);
}

// ── Cargar .env ───────────────────────────────────────────────────────────────
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
        if (key && !(key in process.env)) process.env[key] = val;
    }
}
loadEnv(path.resolve(__dirname, '..', '.env'));

const BASE_URL = process.env.ZITADEL_ISSUER_URI?.replace(/\/$/, '');
const TOKEN    = process.env.ZITADEL_MACHINE_TOKEN_DESIGN;
const ORG_ID   = process.env.ZITADEL_ORG_ID;

const missing = [];
if (!BASE_URL) missing.push('ZITADEL_ISSUER_URI');
if (!TOKEN)    missing.push('ZITADEL_MACHINE_TOKEN_DESIGN');
if (!ORG_ID)   missing.push('ZITADEL_ORG_ID');
if (missing.length) {
    console.error(`[ERROR] Variables vacías: ${missing.join(', ')}`); process.exit(1);
}

// ── Colores de consola ────────────────────────────────────────────────────────
const c = { green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m', bold:'\x1b[1m', reset:'\x1b[0m' };

// ── Helper HTTP ───────────────────────────────────────────────────────────────
async function del(endpoint) {
    const url  = `${BASE_URL}/management/v1${endpoint}`;
    const res  = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization':   `Bearer ${TOKEN}`,
            'Accept':          'application/json',
            'x-zitadel-orgid': ORG_ID,
        },
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { _raw: text }; }
    return { status: res.status, ok: res.ok, body };
}

// ── Rollback steps ────────────────────────────────────────────────────────────
const STEPS = [
    {
        name:     'Custom Login Policy → reset a default',
        endpoint: '/policies/login',
        // DELETE /management/v1/policies/login — ResetLoginPolicyToDefault
        // Elimina la custom policy de la org; vuelve al default de la instancia.
    },
    {
        name:     'Custom Label Policy (colores) → reset a default',
        endpoint: '/policies/label',
        // DELETE /management/v1/policies/label — ResetCustomLabelPolicyToDefault
    },
    {
        name:     'Custom Login Texts (es) → reset a default',
        endpoint: '/text/login/es',
        // DELETE /management/v1/text/login/{language} — ResetCustomLoginTextToDefault
    },
];

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${c.bold}${c.red}`);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ⚠️  ROLLBACK — Zitadel Branding  v2.67                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(c.reset);
    console.log(`  Servidor : ${c.cyan}${BASE_URL}${c.reset}`);
    console.log(`  Org ID   : ${c.cyan}${ORG_ID}${c.reset}`);
    console.log(`  Token    : ${c.cyan}ZITADEL_MACHINE_TOKEN_DESIGN${c.reset} (Org Owner)\n`);

    let passed = 0; let failed = 0;

    for (const step of STEPS) {
        process.stdout.write(`  ⏳ ${step.name}...`);
        try {
            const { status, ok, body } = await del(step.endpoint);

            if (ok || status === 200) {
                process.stdout.write(`\r  ${c.green}✅${c.reset} ${step.name}\n`);
                passed++;
            } else if (status === 404) {
                // 404 = la custom policy/text no existía → ya estaba en default
                process.stdout.write(`\r  ${c.yellow}⚠️ ${c.reset} ${step.name} ${c.yellow}(no existía custom — ya en default)${c.reset}\n`);
                passed++;
            } else {
                process.stdout.write(`\r  ${c.red}❌${c.reset} ${step.name}\n`);
                console.error(`\n      HTTP ${status} — ${JSON.stringify(body, null, 2).replace(/\n/g, '\n      ')}\n`);
                if (status === 401) console.error(`      ${c.yellow}→ Verificá ZITADEL_MACHINE_TOKEN_DESIGN (debe ser Org Owner).${c.reset}\n`);
                if (status === 403) console.error(`      ${c.yellow}→ El token no tiene permisos suficientes sobre esta organización.${c.reset}\n`);
                failed++;
            }
        } catch (err) {
            process.stdout.write(`\r  ${c.red}❌${c.reset} ${step.name}\n`);
            console.error(`\n      Error de red: ${err.message}`);
            console.error(`      Verificá que Zitadel esté corriendo en ${BASE_URL}\n`);
            failed++;
        }
    }

    console.log('\n' + '─'.repeat(66));
    if (failed === 0) {
        console.log(`\n  ${c.green}${c.bold}🎉 Rollback completo: ${passed}/${STEPS.length} pasos exitosos.${c.reset}`);
        console.log(`\n  La pantalla de login ahora usa los defaults de la instancia.`);
        console.log(`  Verificá en: ${c.cyan}${BASE_URL}${c.reset}\n`);
    } else {
        console.log(`\n  ${c.red}${c.bold}⚠️  ${passed}/${STEPS.length} exitosos, ${failed} con errores.${c.reset}`);
        console.log('  Revisá los errores arriba. El script es idempotente — podés volver a correrlo.\n');
        process.exit(1);
    }
}

main().catch(err => {
    console.error(`\n${c.red}[FATAL]${c.reset} ${err.message}`);
    process.exit(1);
});
