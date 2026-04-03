# Especificación de Requerimientos del Sistema (SRS) — DespachantesV2

> Documento vivo. Refleja el estado actual del diseño funcional y técnico del sistema. Se actualiza a medida que se toman decisiones con el cliente.

---

## 1. Introducción

### 1.1 Propósito

Este documento describe los requerimientos funcionales y técnicos del sistema **DespachantesV2**, una plataforma web de gestión para la firma de despacho aduanero López Vener & Asoc. (Uruguay). Su objetivo es centralizar la gestión de clientes, operaciones aduaneras (carpetas), documentación y estados de workflow en una única aplicación accesible desde cualquier dispositivo.

### 1.2 Alcance

El sistema cubre el ciclo completo de una operación aduanera: desde la apertura de una carpeta hasta su cierre, incluyendo la gestión de documentos requeridos, el avance por estados de workflow, el registro de gastos y la trazabilidad de cambios.

El MVP está orientado al uso interno de la firma (empleados y jefe). Un módulo de Portal del Cliente (acceso externo para importadores/exportadores) está previsto para una fase posterior.

El diseño debe ser multi-tenant desde la base de datos (campo `tenant_id` en las entidades clave), aunque en el MVP solo habrá un tenant activo.

### 1.3 Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| Base de datos | PostgreSQL 16 |
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Autenticación | Zitadel (OIDC / OAuth2) |
| Almacenamiento de archivos | MinIO (local) → compatible S3 (producción: Cloudflare R2) |
| Email transaccional | Resend |
| Contenedores (infraestructura local) | Docker Compose (PostgreSQL + MinIO solamente; la app corre fuera de Docker en desarrollo) |

---

## 2. Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Clientes** | CRUD de importadores/exportadores con validación de RUT/CI uruguayo y gestión de contactos por rol |
| **Carpetas / Operaciones** | Gestión de operaciones aduaneras (Importación, Exportación, Tránsito), con tipo, vía de transporte, estado y operador asignado |
| **Documentos** | Carga, visualización, descarga y control de documentos por carpeta. Incluye tipos obligatorios configurables, opcionales y extras libres. Alertas de vencimiento. |
| **Workflow / Estados** | Estados configurables por tipo de operación. Avance manual con registro de auditoría |
| **Configuración** | Gestión de usuarios, roles, tipos de documento, estados de workflow y parámetros del sistema |
| **Portal del Cliente** | (Fase 2) Acceso externo de solo lectura para que el importador/exportador consulte el estado de sus operaciones |

---

## 3. Modelo de datos — Entidades principales

### 3.1 Cliente

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | Multi-tenant |
| `razonSocial` | VARCHAR(200) | Nombre de la empresa o persona |
| `tipoPersona` | ENUM | `EMPRESA`, `FISICA` |
| `tipoDocumento` | ENUM | `RUT`, `CI` |
| `numeroDocumento` | VARCHAR(20) | Validado con algoritmo (ver §4) |
| `direccion` | VARCHAR(300) | |
| `localidad` | VARCHAR(100) | |
| `telefono` | VARCHAR(50) | |
| `email` | VARCHAR(150) | |
| `activo` | BOOLEAN | Default `true` |
| `createdAt` | TIMESTAMP | Auto |
| `updatedAt` | TIMESTAMP | Auto |

### 3.2 Contacto (por cliente)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `clienteId` | UUID | FK → Cliente |
| `tipoContacto` | ENUM | Ver §3.7 |
| `nombre` | VARCHAR(150) | |
| `cargo` | VARCHAR(100) | Opcional |
| `telefono` | VARCHAR(50) | |
| `email` | VARCHAR(150) | |
| `recibeNotificaciones` | BOOLEAN | Default `false` |
| `notas` | TEXT | Opcional |

### 3.3 Carpeta (Operación)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | Multi-tenant |
| `nroCarpeta` | VARCHAR(20) | Número de expediente visible (ej: `0030016`) |
| `clienteId` | UUID | FK → Cliente |
| `tipo` | ENUM | `IMPORTACION`, `EXPORTACION`, `TRANSITO` |
| `viaTransporte` | ENUM | `MARITIMA`, `TERRESTRE`, `AEREA` |
| `estado` | VARCHAR(50) | Código del estado actual (desnormalizado para queries rápidas) |
| `workflowStateId` | UUID | FK → WorkflowState |
| `operadorId` | UUID | FK → Usuario asignado |
| `proveedor` | VARCHAR(200) | Proveedor/exportador en origen |
| `descripcionMercaderia` | TEXT | Descripción de la mercadería |
| `fechaApertura` | DATE | |
| `createdAt` | TIMESTAMP | Auto |
| `updatedAt` | TIMESTAMP | Auto |

### 3.4 TipoDocumento

Define el catálogo de tipos de documentos posibles. Es configurable desde el módulo de Configuración.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | Multi-tenant |
| `code` | VARCHAR(50) | Código interno (ej: `BL`, `FACTURA_COMERCIAL`) |
| `name` | VARCHAR(150) | Nombre visible (ej: `Bill of Lading`) |
| `description` | TEXT | Descripción larga, opcional |
| `appliesTo` | ENUM[] | Array: `IMPORTACION`, `EXPORTACION`, `TRANSITO` |
| `viaTransporte` | ENUM[] | Array: `MARITIMA`, `TERRESTRE`, `AEREA`. Vacío = todas |
| `isAlwaysRequired` | BOOLEAN | Si es obligatorio para todas las operaciones que aplica |
| `hasExpiration` | BOOLEAN | Si el documento tiene fecha de vencimiento |
| `active` | BOOLEAN | Default `true` |

### 3.5 Documento (instancia)

Cada archivo subido a una carpeta es una instancia de esta entidad.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `carpetaId` | UUID | FK → Carpeta |
| `tipoDocumentoId` | UUID | FK → TipoDocumento. Nullable (para documentos extras) |
| `descripcion` | VARCHAR(300) | Texto libre. Obligatorio si tipoDocumentoId es null |
| `fileKey` | VARCHAR(500) | Path/key en el bucket S3/MinIO |
| `fileName` | VARCHAR(300) | Nombre original del archivo |
| `fileSize` | BIGINT | Tamaño en bytes |
| `mimeType` | VARCHAR(100) | |
| `uploadedAt` | TIMESTAMP | Auto |
| `expirationDate` | DATE | Nullable. Visible solo si hasExpiration=true |
| `uploadedBy` | UUID | FK → Usuario |

### 3.6 WorkflowState

Define los estados posibles de una operación, configurables por tipo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | Multi-tenant |
| `operationType` | ENUM | `IMPORTACION`, `EXPORTACION`, `TRANSITO` |
| `stepOrder` | INTEGER | Orden dentro del workflow |
| `code` | VARCHAR(50) | Código único por tipo (ej: `APERTURA`, `EN_ADUANA`) |
| `name` | VARCHAR(150) | Nombre visible |
| `isActive` | BOOLEAN | Default `true` |

### 3.7 ContactType — valores del enum

| Valor | Descripción |
|---|---|
| `RESPONSABLE_PRINCIPAL` | Interlocutor principal de la empresa |
| `ENCARGADO_DEPOSITO` | Responsable de recibir/entregar mercadería |
| `CONTADORA` | Área contable/financiera |
| `GERENTE` | Gerencia general |
| `CONTACTO_EXPORTACION` | Contacto en origen para exportaciones |
| `OTRO` | Otro rol no clasificado |

---

## 4. Validaciones del sistema

### 4.1 Validación de CI (Uruguay)

La cédula de identidad uruguaya tiene entre 6 y 7 dígitos más un dígito verificador. El algoritmo toma los dígitos del número (completando con ceros a la izquierda hasta 7 dígitos), los multiplica respectivamente por los factores `[2, 9, 8, 7, 6, 3, 4]`, suma los productos, calcula el módulo 10 del resultado, y el complemento a 10 de ese módulo (siendo 0 cuando el módulo es 0) debe coincidir con el dígito verificador.

### 4.2 Validación de RUT (Uruguay)

El RUT uruguayo tiene 12 dígitos: los primeros 11 son el número base y el último es el dígito verificador. Se multiplican los dígitos del número base por los factores `[4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`, se suma el total, se calcula el módulo 11 del resultado, y el complemento a 11 (`11 - (suma mod 11)`, siendo 0 si el resultado es 11, y 1 si es 10... pendiente confirmar con DGI) debe coincidir con el dígito verificador.

> Nota: La implementación exacta está en `backend/src/main/java/com/despachantes/api/service/` — revisar y validar con casos reales antes de dar por cerrado.

---

## 5. Flujos de negocio

### 5.1 Workflow de Importación (propuesto — pendiente validación con Gabriel)

| Orden | Código | Nombre |
|---|---|---|
| 1 | `APERTURA` | Apertura de carpeta |
| 2 | `DOCUMENTACION` | Recolección de documentos |
| 3 | `PREVIO_ADUANA` | Previo aduanero / verificación |
| 4 | `DECLARACION_PRESENTADA` | Declaración presentada |
| 5 | `CANAL_ASIGNADO` | Canal asignado (verde/rojo/naranja) |
| 6 | `PAGO_TRIBUTOS` | Pago de tributos y derechos |
| 7 | `LIBRAMIENTO` | Libramiento concedido |
| 8 | `RETIRO_DEPOSITO` | Retiro del depósito |
| 9 | `ENTREGA_CLIENTE` | Entrega al cliente |
| 10 | `CERRADA` | Carpeta cerrada / liquidada |

### 5.2 Workflow de Exportación (propuesto — pendiente validación con Gabriel)

| Orden | Código | Nombre |
|---|---|---|
| 1 | `APERTURA` | Apertura de carpeta |
| 2 | `DOCUMENTACION` | Recolección de documentos |
| 3 | `DECLARACION_EXPORTACION` | Declaración de exportación presentada |
| 4 | `CONTROL_PREVIO` | Control previo / verificación |
| 5 | `AFORO` | Aforo físico (si aplica) |
| 6 | `EMBARQUE_AUTORIZADO` | Embarque autorizado |
| 7 | `EN_TRANSITO` | Mercadería en tránsito |
| 8 | `EMBARCADA` | Mercadería embarcada / despachada |
| 9 | `DOCUMENTOS_ENVIADOS` | Documentos enviados al exterior |
| 10 | `CERRADA` | Carpeta cerrada / liquidada |

### 5.3 Workflow de Tránsito

Pendiente definición con Gabriel. Por defecto se propone reutilizar los estados de Importación con las adaptaciones necesarias.

---

## 6. APIs principales (REST)

Todas las rutas tienen el prefijo `/api`. La autenticación es via token JWT emitido por Zitadel (Bearer token en el header `Authorization`).

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/clients` | Listar clientes (paginado, filtros: search, activo) |
| `POST` | `/api/clients` | Crear cliente |
| `GET` | `/api/clients/{id}` | Obtener cliente por ID |
| `PUT` | `/api/clients/{id}` | Actualizar cliente |
| `DELETE` | `/api/clients/{id}` | Desactivar cliente (soft delete) |
| `GET` | `/api/clients/{id}/contacts` | Listar contactos del cliente |
| `POST` | `/api/clients/{id}/contacts` | Agregar contacto |
| `PUT` | `/api/clients/{id}/contacts/{cid}` | Actualizar contacto |
| `DELETE` | `/api/clients/{id}/contacts/{cid}` | Eliminar contacto |

### Carpetas (Operaciones)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/operations` | Listar carpetas (paginado, filtros: tipo, estado, clienteId, search) |
| `POST` | `/api/operations` | Crear carpeta |
| `GET` | `/api/operations/{id}` | Obtener carpeta por ID |
| `PUT` | `/api/operations/{id}` | Actualizar datos de la carpeta |
| `PATCH` | `/api/operations/{id}/state` | Avanzar estado de workflow |
| `DELETE` | `/api/operations/{id}` | Eliminar/archivar carpeta |

### Tipos de Documento

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/document-types` | Listar tipos de documento (filtros: appliesTo, viaTransporte) |
| `POST` | `/api/document-types` | Crear tipo (admin) |
| `PUT` | `/api/document-types/{id}` | Actualizar tipo (admin) |

### Documentos (por carpeta)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/operations/{id}/documents` | Listar documentos de la carpeta |
| `POST` | `/api/operations/{id}/documents` | Subir documento (multipart/form-data) |
| `GET` | `/api/documents/{docId}/download` | Descargar archivo (presigned URL o stream) |
| `PUT` | `/api/documents/{docId}` | Actualizar metadata (descripción, fecha vencimiento) |
| `DELETE` | `/api/documents/{docId}` | Eliminar documento |

### Estados de Workflow

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/workflow-states` | Listar estados (filtro: operationType) |
| `POST` | `/api/workflow-states` | Crear estado (admin) |
| `PUT` | `/api/workflow-states/{id}` | Actualizar estado (admin) |
| `PUT` | `/api/workflow-states/reorder` | Reordenar steps (admin) |

---

## 7. Pendientes de definición

Los siguientes puntos están abiertos y requieren confirmación con Gabriel antes de implementar:

- **Workflow exacto de estados**: Los pasos propuestos en §5.1 y §5.2 son una primera versión. Confirmar nombre, orden y si alguno es opcional o se puede saltar.
- **Workflow de Tránsito**: Definir si comparte estados con Importación o tiene su propio flujo.
- **Numeración de carpetas**: ¿Se genera automáticamente (correlativo)? ¿Tiene prefijo por año? ¿Gabriel ya tiene un rango asignado (ej: parte de 003xxxx)?
- **Canal aduanero**: ¿Se registra el canal asignado (verde/naranja/rojo) como campo de la carpeta o como nota en el historial?
- **Alertas de vencimiento**: ¿Con cuántos días de anticipación debe aparecer la alerta? ¿Se envía email automático?
- **Portal del Cliente**: ¿Cuándo entra en scope? ¿El cliente puede subir documentos o solo visualizar?
- **Facturación / Liquidación**: ¿Es un módulo separado o se incorpora como parte de la carpeta? ¿Integración con algún sistema de facturación existente?
- **Gestión de usuarios**: ¿Gabriel quiere auto-gestionar los usuarios desde el sistema o prefiere que lo haga el desarrollador?
- **Nombre de la aplicación en UI**: ¿"Sistema de Gestión" genérico o con nombre de marca específico?

---

> Documento vivo — última actualización: 2026-03-21
