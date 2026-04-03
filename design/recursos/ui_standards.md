# UI Standards — DespachantesV2
## Estándares Específicos del Proyecto

> Complementa el CLAUDE.md global. Cubre patrones específicos de este sistema aduanero: carpetas, estados, documentos, tipos de operación.

---

## 1. Pills de Tipo de Operación (Importación / Exportación)

**Regla**: Nunca usar azul brillante ni rojo. Usar colores del sistema que complementen la paleta navy/gold.

| Tipo         | Background  | Texto     | Clase completa                                        |
|--------------|-------------|-----------|-------------------------------------------------------|
| IMPORTACIÓN  | `#E8EDF8`   | `#2E4A7D` | `style="background:#E8EDF8; color:#2E4A7D"` + `font-bold text-[11px] px-2.5 py-1 rounded-lg` |
| EXPORTACIÓN  | `#FDF6EE`   | `#8B6530` | `style="background:#FDF6EE; color:#8B6530"` + `font-bold text-[11px] px-2.5 py-1 rounded-lg` |

**Versión abreviada** (en tablas donde el espacio es limitado):
- IMP: mismas clases pero texto "IMP"
- EXP: mismas clases pero texto "EXP"

---

## 2. Pills de Estado de Carpeta

| Estado                    | Clases Tailwind                           |
|---------------------------|-------------------------------------------|
| APERTURA                  | `bg-slate-100 text-slate-500`             |
| DOCUMENTACION_EN_PROCESO  | `bg-blue-50 text-blue-600`                |
| DOCUMENTACION_COMPLETA    | `bg-blue-100 text-blue-700`               |
| NUMERADO                  | `bg-amber-50 text-amber-600`              |
| CANAL_ASIGNADO            | `bg-amber-100 text-amber-700`             |
| EN_DEPOSITO               | `bg-purple-50 text-purple-600`            |
| LEVANTE                   | `bg-teal-50 text-teal-600`                |
| RETIRADO                  | `bg-teal-100 text-teal-700`               |
| FACTURADO                 | `bg-emerald-50 text-emerald-600`          |
| CERRADO                   | `bg-emerald-100 text-emerald-700`         |

Tamaño estándar: `text-[10px] font-bold px-2.5 py-1 rounded-full`

---

## 3. Vías de Transporte

| Vía        | Ícono sugerido  | Estilo pill                        |
|------------|-----------------|------------------------------------|
| MARITIMA   | Barco / Anchor  | `bg-brand-slate-50 text-brand-slate-600` |
| TERRESTRE  | Camión / Truck  | `bg-brand-slate-50 text-brand-slate-600` |
| AEREA      | Avión / Plane   | `bg-brand-slate-50 text-brand-slate-600` |

Las tres vías usan el mismo estilo neutro (no semántico). No agregar colores por vía de transporte.

---

## 4. Consistencia visual entre Clientes y Carpetas

**Regla**: El diseño de tablas, contenedores y cabeceras en la pantalla de **Clientes** debe ser idéntico al de **Carpetas** (ExpedientesPage / CarpetaDetailPage). Esto abarca:

| Elemento                | Clase obligatoria                                                                 |
|-------------------------|-----------------------------------------------------------------------------------|
| Contenedor de tabla     | `bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden` |
| Header de tabla         | `text-[10px] font-bold tracking-wide text-brand-navy/40 px-5 py-3.5`             |
| Filas                   | `divide-y divide-brand-navy/[0.04]` + hover `hover:bg-brand-gold/[0.04]`         |
| Fila seleccionada       | `bg-brand-gold/[0.06]` + `border-l-2 border-l-brand-gold`                        |
| Estado vacío            | Ícono centrado + texto, `text-brand-navy/20`                                      |
| Skeleton loading        | `animate-pulse bg-brand-navy/5 rounded`                                           |

Cualquier cambio de estilo en tablas de Carpetas debe replicarse en Clientes y viceversa.

---

## 5. Adjuntar Archivos — Patrón Estándar

**Componente**: `<FileUpload>` en `src/components/ui/FileUpload.jsx`

### Flujo completo
1. Usuario hace click en "Adjuntar" o arrastra un archivo al área designada
2. Se muestra el selector de **tipo de documento** (dropdown/select)
3. Aparece la zona de drop o el file picker nativo
4. Al seleccionar el archivo: preview del nombre + tamaño
5. Botón "Subir" confirma (spinner durante la subida)
6. Al completar: el archivo aparece en la lista con nombre, tipo y fecha

### Zona de drop
```
border-2 border-dashed border-brand-navy/20 rounded-2xl p-6 text-center
hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-all cursor-pointer
```
Texto: ícono Upload + "Arrastrá el archivo aquí o hacé click para seleccionar"

### Estados del uploader
- **Idle**: zona de drop con borde punteado
- **Dragging over**: borde gold + fondo gold/5
- **Uploading**: spinner + barra de progreso + nombre del archivo
- **Error**: borde rojo + mensaje de error descriptivo
- **Success**: desaparece, el archivo aparece en la lista

### Lista de documentos
Cada item tiene: ícono de tipo de archivo + nombre + fecha + botones (Descargar, Compartir, Eliminar)

Los botones de acción en la lista son **discretos**: íconos sin relleno, `text-brand-navy/30 hover:text-brand-navy` (excepto Eliminar: `hover:text-red-500`)

---

## 5. Compartir Archivos — Patrón Estándar

**Trigger**: Botón "Compartir" en la lista de documentos de una carpeta

### Flujo
1. Click en "Compartir" → abre un modal pequeño (no drawer)
2. El modal genera/muestra el link de acceso público (token de 7 días)
3. Botón "Copiar link" con feedback visual (✓ Copiado)
4. Sección "Enviar por email": input de email + botón "Enviar"
5. Estados del envío: idle → cargando → enviado / error
6. Modal se puede cerrar en cualquier momento

### Modal de compartir
```
max-w-sm w-full bg-white rounded-2xl shadow-2xl p-6
```
Nunca usar un drawer para esta acción: es demasiado simple y contextual.

---

## 6. Navegación Cliente → Carpeta

**Patrón elegido**: Breadcrumb + página completa (Opción A)

- Click en una fila de carpeta navega a `CarpetaDetailPage` (página completa, reemplaza contenido principal)
- Breadcrumb: `Clientes › ACME SA › 2025-IMP-0042` (desde Clientes) o `Carpetas › 2025-IMP-0042` (desde Carpetas)
- Botón volver (←) al inicio de la fila de breadcrumb restaura la página de origen
- Desde Clientes: restaura el panel lateral con el cliente seleccionado (`restoreContext.restoreClient`)
- El sidebar resalta la página de origen mientras se está en detalle de carpeta

---

## 7. Wizard de Estado de Carpeta

**Patrón elegido**: Rosca + Select Estético (Concepto 2)

- `StatusRing` (`src/components/ui/StatusRing.jsx`): rosca SVG 110×110px, navy=completados, gold=actual, gris=pendientes. Centro: "N/10" + label del estado actual. Abajo: ← prev · next →
- `StateSelector` (`src/components/ui/StateSelector.jsx`): lista vertical de todos los estados. Pasados: check + texto tachado + hover ámbar (para retroceder). Actual: fondo gold/10 + badge "ACTUAL". Futuros: círculo vacío + chevron → hover
- Se puede ir tanto hacia adelante como hacia atrás. Cualquier cambio abre `ConfirmModal`:
  - Avanzar: mensaje neutro, botón confirm navy
  - Retroceder: mensaje de advertencia, botón confirm rojo (`danger`)
- `StateSelector` siempre visible (no native select), funciona en todos los breakpoints

---

## 8. Contenedores de Contenido — Tarjetas Blancas

**Regla obligatoria**: Todo formulario, lista o contenido de datos que se muestra sobre el fondo gris (`bg-brand-slate-50`) DEBE estar dentro de una tarjeta blanca. Sin esto el contraste es insuficiente y los campos de input se pierden en el fondo.

### Tarjeta estándar de contenido
```
bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-5 md:p-6
```

### Tarjeta de identidad (cabezal de página de detalle)
```
bg-white rounded-2xl border border-brand-navy/5 shadow-sm
  → Header interno: p-4 md:p-5
  → Tabs integrados en el borde inferior de la tarjeta (border-t border-brand-navy/5 px-2)
```

### Uso correcto
- ✅ Formulario de edición → dentro de tarjeta blanca
- ✅ Lista de documentos → dentro de tarjeta blanca
- ✅ Selector de estado → dentro de tarjeta blanca
- ✅ Panel lateral de detalle de cliente → `bg-white` en el panel
- ❌ Formulario flotando directo sobre `bg-brand-slate-50` → PROHIBIDO

### Tabla de datos (dentro de tarjeta blanca)
Las tablas ya tienen su propio container blanco:
```
bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 overflow-hidden
```

---

## 9. Display de Carpetas en Panel de Cliente

Cuando las carpetas de un cliente se listan en un panel lateral o en una sección de detalle:

### Agrupación
- **Activas** (primero): estados que no son CERRADO, FACTURADO ni RETIRADO
- **Cerradas** (segundo, colapsadas por defecto si hay más de 3): CERRADO, FACTURADO, RETIRADO

### Cada fila de carpeta incluye
- Ícono de carpeta (`FolderOpen`)
- Número de carpeta en `font-mono font-bold`
- Fecha de apertura en `text-[10px] text-brand-navy/40`
- Pill de estado (ver tabla en sección 2)
- Chevron →

### Contenedor de cada fila
```
w-full flex items-center gap-3 p-3 bg-brand-slate-50 rounded-xl
hover:bg-white border border-transparent hover:border-brand-navy/5
transition-all text-left group
```

---

## 10. Filtros en Tablas — Mobile First

### Desktop (lg+)
Filtros inline: search + chips de tipo + otros filtros visibles

### Tablet (md)
Search ocupa todo el ancho. Los filtros de tipo/estado en una segunda línea.

### Mobile (< md) — OBLIGATORIO
- Un único botón "Filtros" con ícono + conteo de filtros activos (ej: "Filtros (2)")
- Al tocar: se despliega un panel bottom sheet o dropdown con todos los filtros
- El search siempre visible (no colapsa)

---

## 11. Exportación / Importación de Datos

- Botones "+ Excel" o "Exportar" siempre están **deshabilitados** con `cursor-not-allowed opacity-50` hasta implementar
- El `title` del botón deshabilitado es: `"Disponible próximamente"`
- No eliminar estos botones del UI aunque no funcionen: marcan el roadmap visual

---

## 12. Patrones de Formulario para Carpetas

### Campos editables en un PUT
Los siguientes campos son editables en modo edición:
- `tipoOperacion` (IMPORTACION / EXPORTACION)
- `viaTransporte` (MARITIMA / TERRESTRE / AEREA)
- `proveedor`
- `descripcionMercaderia`
- `valorEstimado`

Los siguientes son **no editables** (solo lectura en modo edición):
- `nroCarpeta` (asignado en creación)
- `clienteId` (solo se puede cambiar en creación)
- `fechaApertura` (automático)

### Regla de validación
Todos los `select` de tipo y vía deben incluir siempre su value actual como option seleccionado por defecto, incluso si el backend devuelve `null` (mostrar opción vacía "Seleccionar...").

---

## 13. Tipografía

- **Fuente única**: `Montserrat`. Sin excepciones.
- Títulos de módulo (H1): `text-2xl font-display font-semibold text-brand-navy tracking-tight`
- Subtítulos (H2): `text-lg font-semibold text-brand-slate-800`
- Body: `text-sm text-brand-slate-700`
- Labels de formulario: `text-[10px] font-bold text-brand-navy/50 tracking-widest uppercase`
- Badges/caps pequeñas: `text-[10px] font-bold tracking-wide`
- **Prohibido** usar `uppercase` en clases Tailwind para texto body o títulos
