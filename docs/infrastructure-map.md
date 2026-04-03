# Mapa de Infraestructura y Servicios (Despachantes V2)

**Regla de Oro:** La aplicación es stateless. Todo estado, archivo o identidad se delega a los servicios de infraestructura definidos aquí. TODAS las conexiones deben leerse desde variables de entorno.

## 1. Base de Datos (App)
- **Motor:** PostgreSQL 16.
- **Uso:** Datos relacionales del dominio (Carpetas, Clientes, Workflow, Tipos de Contacto, etc.).
- **Entorno Local:** `localhost:5432`.
- **Variables requeridas:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.
- **PROHIBIDO:** Guardar usuarios, contraseñas, tokens de sesión o roles en esta BD. Eso es responsabilidad exclusiva de Zitadel.

## 2. Almacenamiento de Archivos (Storage S3)
- **Motor:** MinIO.
- **Uso:** Almacenamiento inmutable de adjuntos, PDFs y comprobantes de la operativa aduanera. PROHIBIDO guardar archivos en el file system de la app (ej. `/uploads`).
- **Entorno Local:** API `localhost:9010` / Consola `localhost:9011`.
- **Variables requeridas:** `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`.

## 3. Identidad, Usuarios y Roles (Zitadel — Fuente de Verdad Única)

> **Zitadel es el dueño absoluto de todos los usuarios y roles del sistema.**
> Esta aplicación nunca almacena contraseñas, crea sesiones propias ni gestiona tablas de usuarios. Todo eso es responsabilidad de Zitadel.

- **Motor:** Zitadel v2.67.
- **Entorno Local:** `localhost:8080`.
- **Variables requeridas (OAuth2 / JWT validation):** `ZITADEL_ISSUER_URI`, `ZITADEL_CLIENT_ID`.

### Qué gestiona Zitadel (y SOLO Zitadel):
| Responsabilidad | Quién lo hace |
|---|---|
| Registrar y almacenar usuarios | Zitadel |
| Almacenar y validar contraseñas | Zitadel |
| Emitir y firmar JWTs | Zitadel |
| Definir roleKeys del proyecto (`jefe`, `emp_exp`, etc.) | Zitadel (configuración manual en consola) |
| Asignar roles a usuarios | Zitadel (vía Management API, disparada desde esta app) |
| Enviar emails de activación/reset | Zitadel |
| Gestionar MFA y seguridad de sesión | Zitadel |

### Configuración de roleKeys en Zitadel (paso obligatorio)
Los siguientes roleKeys **deben existir en el proyecto Zitadel** antes de poder asignarlos a usuarios desde la pantalla de Gestión de Usuarios. Se crean en: **Consola Zitadel → Projects → [tu proyecto] → Roles → Add Role**.

| roleKey    | Label en la app        |
|------------|------------------------|
| `admin`    | Administrador          |
| `jefe`     | Jefe                   |
| `emp_exp`  | Empleado Exportaciones |
| `emp_imp`  | Empleado Importaciones |
| `emp_adm`  | Empleado Administrativo|
| `cliente`  | Cliente                |

Si el roleKey no existe en Zitadel, el endpoint `POST /api/v1/users` devuelve 400 al intentar asignar el rol.

### 3a. Zitadel Management API (Server-to-Server)
El backend llama a la Zitadel Management REST API v1 para crear usuarios y asignar roles desde la pantalla de Gestión de Usuarios.

- **Autenticación:** PAT (Personal Access Token) de un Machine User con rol `Org User Manager`.
- **Org ID:** Header `x-zitadel-orgid` en cada llamada.
- **Variables requeridas:**
  - `ZITADEL_MACHINE_TOKEN` — PAT del Machine User de servicio.
  - `ZITADEL_ORG_ID` — ID de la organización en Zitadel.
  - `ZITADEL_PROJECT_ID` — ID del proyecto donde están los roleKeys.

**Paths de Management API v1 utilizados:**
```
POST /management/v1/users/human              → crear usuario
POST /management/v1/users/{id}/grants        → asignar rol
POST /management/v1/users/_search            → listar usuarios
POST /management/v1/user/grants/_search      → listar grants (SINGULAR, sin guión bajo)
```

**Flujo de alta de operador:**
1. Admin/Jefe completa el formulario en la pantalla "Gestión de Usuarios".
2. El backend llama a `POST /management/v1/users/human` → Zitadel crea el usuario.
3. El backend llama a `POST /management/v1/users/{id}/grants` → Zitadel asigna el rol.
4. Zitadel envía automáticamente un email de activación al nuevo operador (configurable en Zitadel).
5. El operador hace click en el link del email y establece su contraseña directamente en Zitadel.

**Setup del Machine User:**
1. Consola Zitadel → Service Accounts → New Service Account.
2. Generar Personal Access Token (PAT) → guardar en `ZITADEL_MACHINE_TOKEN`.
3. Org → Members → Add Member → buscar el Machine User → asignar rol `Org User Manager`.
4. Org ID: Consola → Organization Settings → copiar en `ZITADEL_ORG_ID`.
5. Project ID: Consola → Projects → [tu proyecto] → copiar en `ZITADEL_PROJECT_ID`.
- **Clase de servicio:** `ZitadelManagementService.java` (usa Spring `RestClient`).

## GESTIÓN DE PERMISOS EN UI (ANTI-PATRONES PROHIBIDOS)
- **PROHIBIDO:** Tablas `role_permissions` o `permissions` en PostgreSQL.
- **PROHIBIDO:** Endpoints que devuelvan listas de permisos desde la BD.
- **Frontend:** Los permisos de UI se derivan del rol del JWT usando el mapa estático `rolePermissions.js`. Roles: `admin`, `jefe`, `emp_exp`, `emp_imp`, `emp_adm`, `cliente`.
- **Backend:** Endpoints sensibles protegidos con `@PreAuthorize("hasAnyRole(...)")` que valida el JWT de Zitadel. Los roles se extraen del claim `urn:zitadel:iam:org:project:roles`.
