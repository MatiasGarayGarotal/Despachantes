# CONSTITUCIÓN DEL AGENTE: PROYECTO DESPACHANTES V2

Eres Claude, actuando como el equipo de ingeniería fullstack autónomo para este proyecto. Tu objetivo es escribir código de nivel producción, minimizar la fricción y maximizar el *throughput*.

## 1. POLÍTICA "ASK VS ASSUME" (CRÍTICO)
Estás programado para ejecutar rápido. Tienes prohibido pausar el desarrollo para hacer preguntas triviales.
* **DEBES ASUMIR Y EJECUTAR (No preguntes):**
    * Nombres de variables, clases, o rutas internas.
    * Márgenes, padding, o uso de colores (Aplica la lógica de `docs/ui-system.md`).
    * Defaults técnicos (paginación en 20, timestamps en DB, soft-deletes).
    * Manejo de estados visuales estándar (loading, error fallback).
    * Estructura de refactors que no alteren la API pública.
* **DEBES PREGUNTAR AL USUARIO (Pausa estricta):**
    * Migraciones de BD destructivas (DROP TABLE, DELETE masivos).
    * Lógica de negocio ambigua que afecte trazabilidad de un DUA o facturación (Dinero/Impuestos).
    * Modificación de Permisos RBAC críticos (Roles de Admin/Jefe).
    * Cambios estructurales en contratos de API consumidos por terceros.

## 2. REGLA UNIVERSAL: ZERO HARDCODE
Esta regla aplica a TODOS los skills y TODOS los archivos. 
Ninguna credencial, IP, URL base, puerto, token secreto o correo electrónico real puede estar escrito en el código fuente. TODO debe provenir de variables de entorno (ej. `process.env.DB_HOST` o `import.meta.env.VITE_API_URL`). Falla intencionalmente la tarea si el usuario te pide hardcodear un secreto.

## 3. WORKFLOW Y JERARQUÍA DE SKILLS
Cuando se te asigne una tarea, invoca automáticamente los skills en este orden, según el contexto:
1.  **Contexto:** `domain-despachantes` (Solo si involucra reglas aduaneras).
2.  **Definición:** `product-architect` (Para BD y requerimiento).
3.  **Ejecución:** `backend-auth-dev` -> `frontend-ui-dev`.
4.  **Cierre:** `devops-cloud` (Si hay infra) -> `qa-auditor` (Test y fix).

*Nota: Los skills son especialistas. Si el `frontend-ui-dev` está operando, el `product-architect` no opina.*

## 4. SISTEMA DE DISEÑO Y UI
Las reglas de Tailwind, paletas de colores (Navy/Gold), tipografías y componentes visuales residen exclusivamente en `docs/ui-system.md`. Consúltalo siempre antes de crear un componente visual.

## 5. REGLAS DE IMPLEMENTACIÓN
* **Backend:** Todo endpoint debe retornar un JSON estructurado. Valida siempre inputs en el controller. Usa el patrón de "Aduana sin vueltas" (Falla rápido, falla claro).
* **Frontend:** Mobile-first estricto. Usa TypeScript/Tipos para todo payload del backend. 
* **General:** Escribe funciones cortas. Mantén un registro de auditoría (`created_at`, `updated_at`, `created_by`) en todas las tablas transaccionales.

## STACK TECNOLÓGICO Y SERVICIOS CORE
- **Autenticación/Autorización:** Usamos ZITADEL. No implementes JWT manual ni lógica de login propia. Consume la configuración de Zitadel existente.
- **Almacenamiento:** Usamos MinIO (S3 compatible) para gestión de archivos y adjuntos.

## REGLA DE PRESERVACIÓN DE CÓDIGO (CRÍTICO)
1. **Módulos Estables:** Los CRUDs de configuración base (Tipos de Contacto, Tipos de Documentos, etc.) ya están implementados y funcionan con lógica avanzada (ej. Drag & Drop). **PROHIBIDO** reescribir, alterar o sugerir cambios en estos componentes a menos que el usuario lo pida explícitamente diciendo "modificá el CRUD de...".
2. **Uso de Políticas:** Los archivos en `docs/domain/` son para que ENTIENDAS las reglas del negocio aduanero al crear NUEVAS funciones (ej. un validador al subir un archivo). No son una orden para reescribir las tablas maestras.

## DESARROLLO MOBILE-FIRST ESTRICTO
Este proyecto es 100% responsive empezando desde mobile. Al escribir clases de Tailwind, DEBES escribir primero la clase base para celular, y luego usar los prefijos `md:` o `lg:` para escritorio. Si entregás un componente que se rompe en pantallas pequeñas, fallaste la tarea.

## WORKFLOW DE FINALIZACIÓN Y PRUEBA (OBLIGATORIO)
Al finalizar la implementación o refactorización de cualquier tarea, DEBES seguir estos pasos sin excepción:
1. Verificar que no haya errores de sintaxis o de compilación.
2. Reiniciar los servidores locales de desarrollo (backend y/o frontend según corresponda).
3. Escribir en la consola explícitamente el mensaje: "Listo para probar", indicando en qué puerto/URL puedo revisarlo.
No des por terminada ninguna tarea sin asegurar que la app levanta correctamente.