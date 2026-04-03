---
name: domain-despachantes
description: Diccionario y contexto de negocio para despachantes de aduana en Uruguay (DUA, DNA, Mega 6, canales).
---
# Domain Expert: Despachantes de Aduana (Uruguay)

**Rol:** Proveedor de contexto estático. Nunca generas código. Actúas como diccionario para otros skills.

## Glosario Crítico
- **DUA:** Documento Único Aduanero (Ej: 2024-IMP-001234).
- **Mega 6:** Sistema oficial de la DNA.
- **Carpeta:** Contenedor digital del despachante que agrupa los documentos de una operación.
- **Canales DNA:** Verde (automático), Naranja (documental), Rojo (físico).
- **Vías:** Marítima (BL), Terrestre (CRT/MIC), Aérea (AWB).
- **Admisión Temporaria:** Riesgo alto. Vencimiento estándar 18 meses. Multas graves.

## Reglas de Negocio del Dominio
1. Una operación pertenece a un solo cliente. Un cliente tiene N operaciones.
2. El DUA se asigna a posteriori, la carpeta nace sin DUA.
3. El "Sobre" es sagrado: el sistema debe replicar la inmutabilidad de los documentos oficiales adjuntos.
4. Trazabilidad absoluta: Nada se borra, todo cambio de estado se audita.

## Flujo por Defecto (Asumir si no se especifica)
Apertura -> Docs en Proceso -> Numerado (DUA) -> Canal Asignado -> Levante -> Facturado -> Cerrado.

## ESTRUCTURA DE ROLES Y PERMISOS (RBAC)
El sistema opera con roles fijos definidos a nivel de negocio. La visibilidad de pantallas y botones depende de estos roles.
Los roles se leen directamente del JWT de Zitadel — NO hay tabla de permisos en BD.

### Roles Internos (Agencia)
1. **Administrador:**
   - Key Zitadel: `admin`
   - Acceso total al sistema.
   - Exclusivo: Configuración de sistema, eliminar carpetas, gestionar operadores, **configuración de templates de email** (SOLO admin).
2. **Jefe:**
   - Key Zitadel: `jefe`
   - Supervisión total de la operativa.
   - Habilitado: Crear/Editar carpetas, asignar canales, emitir proformas/liquidaciones, ver reportes financieros, configuración de tipos de documento y tipos de contacto.
   - Deshabilitado: Eliminación destructiva de registros, configuración de sistema, **templates de email**.
3. **Empleado Exportaciones:**
   - Key Zitadel: `emp_exp`
   - Gestión del día a día de operaciones de exportación.
   - Habilitado: Ver carpetas, subir documentos, cambiar estados operativos (hasta Levante).
   - Deshabilitado: Emitir facturas/liquidaciones, borrar carpetas, modificar honorarios, acceso a Configuración.
4. **Empleado Importaciones:**
   - Key Zitadel: `emp_imp`
   - Gestión del día a día de operaciones de importación.
   - Habilitado: Ver carpetas, subir documentos, cambiar estados operativos (hasta Levante).
   - Deshabilitado: Emitir facturas/liquidaciones, borrar carpetas, modificar honorarios, acceso a Configuración.
5. **Empleado Administrativo:**
   - Key Zitadel: `emp_adm`
   - Gestión del día a día de todas las operaciones.
   - Habilitado: Ver carpetas, subir documentos, cambiar estados operativos (hasta Levante).
   - Deshabilitado: Emitir facturas/liquidaciones, borrar carpetas, modificar honorarios, acceso a Configuración.

### Roles Externos (Clientes)
1. **Cliente Externo (Solo Lectura / Acción Limitada):**
   - Key Zitadel: `cliente`
   - Pantallas: Solo ve sus PROPIAS carpetas (filtrado en backend).
   - Habilitado: Descargar documentos, subir documentos solicitados.
   - Deshabilitado: Botones de cambio de estado, canales, edición de datos aduaneros.

### Regla crítica de Email Templates
Los templates de email **SOLO** son accesibles para el rol `admin`. Ningún otro rol, incluido `jefe`, puede ver ni editar templates de email. Esta restricción es de negocio (dato sensible de comunicación oficial).