# Design System & UI Specs (Tailwind CSS)

**Identidad de Marca:** LÓPEZ VENER & ASOC.
- **Tipografía Base:** `font-poppins` (Debe configurarse en el tailwind.config.js).
- **Colores Core:**
  - `brand-navy`: `#0E3048` (Sidebar, Header, Textos principales).
  - `brand-gold`: `#B18F5B` (Iconos, estados activos, links, badges).
  - `brand-accent`: `#E67E22` (Naranja utilizado en alertas e indicadores de tabs activos).

## 1. Estructura Maestra (Layout)
- **Sidebar:** Ocupa toda la altura, fondo `bg-brand-navy`, texto `text-white/70`. El ítem de menú activo usa texto `text-brand-gold` con un leve background o indicador.
- **Main Canvas:** Fondo gris muy sutil `bg-[#F0F2F5]`. 
- **Borde de superposición:** El canvas principal TIENE que tener un radio pronunciado superior izquierdo para dar efecto de profundidad sobre el sidebar: `rounded-tl-[40px]`.

## Comportamiento Responsive (Mobile First)
- **Sidebar:** En mobile (pantallas `< md`), el sidebar DEBE estar oculto por defecto, accesible mediante un menú hamburguesa (`z-50`, fixed, off-canvas). En escritorio (`md:` y superior), el sidebar es fijo a la izquierda.
- **Grillas y Listas:** En mobile, usar apilamiento vertical (`flex-col` o `grid-cols-1`). Las tablas complejas en mobile deben permitir scroll horizontal interno (`overflow-x-auto`) o transformarse en tarjetas apiladas.
- **Botones y Touch Targets:** En mobile, todo elemento clickeable debe tener al menos `44px` de alto (ej. `py-3` o `h-11`) para ser fácilmente tocado con el dedo.

## 2. Tarjetas (Cards)
- **Dashboard Cards (Estadísticas):** - Fondo blanco: `bg-white`.
  - Bordes y sombras ultra suaves: `rounded-xl shadow-sm border border-gray-100/50`.
  - El ícono de la tarjeta va dentro de un contenedor cuadrado con bordes redondeados (aprox 12px) y color de fondo transparente/teñido según el estado (ej. `bg-brand-accent/10 text-brand-accent`).
  - Número estadístico: Enorme y fino (ej. `text-5xl font-light text-brand-navy`).

## 3. Navegación en Vista (Tabs)
- Las pestañas internas (ej. Bandeja de entrada / Directorio) no usan botones rellenos, sino diseño de borde inferior.
- **Activo:** Texto `text-brand-navy font-semibold` con borde inferior naranja `border-b-2 border-brand-accent pb-2`.
- **Inactivo:** Texto gris `text-gray-400 font-medium`.

## 4. Tablas de Datos
- **Header (th):** Semántica de metadatos. `text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] pb-3 border-b border-gray-200`.
- **Celdas (td):** `text-sm text-brand-navy py-4 border-b border-gray-100`.

## Matriz Estricta de Contraste y Colores
Tienes PROHIBIDO inventar combinaciones de colores. Para garantizar la legibilidad y accesibilidad (WCAG), usa EXCLUSIVAMENTE estos pares:

- **Fondo Oscuro (`bg-brand-navy`):** - Texto principal: SOLO Blanco (`text-white`).
  - Texto secundario: Blanco translúcido (`text-white/70`).
  - Acentos sobre este fondo: `text-brand-gold`.
  - PROHIBIDO usar textos grises oscuros o negros sobre Navy.

- **Fondo Claro (`bg-white` o `bg-[#F0F2F5]`):**
  - Texto principal: SOLO Navy (`text-brand-navy`).
  - Texto secundario: Gris medio (`text-gray-500` o `text-brand-navy/60`).
  - PROHIBIDO usar textos blancos o amarillos sobre estos fondos claros.

- **Color de Acento (`brand-gold` y `brand-accent`):**
  - Si usas el Oro o el Naranja como fondo (`bg-brand-gold`), el texto DEBE ser oscuro (`text-brand-navy` o `text-black`). Nunca texto blanco, ya que no da el contraste suficiente.

## 5. Modales y Popups

### Overlay base (todos los modales)
```
fixed inset-0 bg-brand-navy/40 backdrop-blur-sm
```

### Modal de confirmación (centrado, max-w-sm)
- Wrapper: `fixed inset-0 z-[90] flex items-center justify-center p-4`
- Panel: `relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10`
- Animación: `initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}` · spring `damping:25 stiffness:300`

### Modal de contenido (ej: ShareModal, max-w-md)
- Wrapper: `fixed inset-0 z-[80] flex items-center justify-center p-4`
- Panel: `relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10`
- Animación: misma que confirmación

### PreviewModal — mobile-first (pantalla completa en mobile, centrado en desktop)
- Wrapper: `fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4`
- Panel: `relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden`
- Animación: `initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}` · spring `damping:28 stiffness:300`
- Header fijo: `flex items-center justify-between px-4 py-3 border-b border-brand-navy/5 shrink-0`
- Cuerpo scrolleable: `flex-1 overflow-hidden flex items-center justify-center bg-brand-slate-50`

### Reglas de z-index para modales
| Nivel    | z-index   | Uso                                      |
|----------|-----------|------------------------------------------|
| Base     | `z-[80]`  | Modales de contenido (ShareModal, etc.)  |
| Preview  | `z-[85]`  | PreviewModal (previsualizador)           |
| Confirm  | `z-[90]`  | ConfirmModal (acciones destructivas)     |

### Reglas generales
- **Nunca** usar `alert()`, `confirm()` o `prompt()` nativos del browser.
- **Nunca** abrir un drawer sobre otro drawer. Si se necesita confirmación desde dentro de un drawer, usar un `ConfirmModal` centrado (`z-[90]`).
- Siempre envolver modales con `<AnimatePresence>` para animar entrada y salida.
- El click en el overlay siempre cierra el modal (`onClick={onClose}` en el wrapper).
- El panel interno siempre frena el evento: `onClick={e => e.stopPropagation()}`.
## Patrones de Componentes (UI Patterns)
- **Selector de Clientes:** Siempre que se deba listar, buscar o seleccionar un cliente en cualquier formulario o vista, DEBES usar un componente tipo Combobox (Select con input de búsqueda/filtro incluido). Nunca uses un `<select>` nativo HTML simple, ya que la lista de clientes es extensa.