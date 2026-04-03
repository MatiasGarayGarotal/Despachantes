Skill: Sistema de Diseño Universal - López Vener & Asoc.

Esta skill establece las normas de UI/UX para la creación de cualquier interfaz dentro del ecosistema de aplicaciones de López Vener & Asoc. El objetivo es mantener una identidad visual cohesiva en todos los módulos (Dashboard, Clientes, Expedientes, Configuración).

1. Fundamentos de Color (Paleta Global)

Los agentes deben utilizar estas constantes para asegurar la consistencia de marca:

Color Primario: #0E3048 (Azul Marino Profundo). Utilizado en estructuras maestras (Sidebar, Header, Footers) y fondos de navegación.

Color Secundario / Acento: #B18F5B (Dorado Mate). Reservado para elementos de alta jerarquía, iconos activos, botones de acción principal y logotipos.

Fondo de Interfaz (Surface): #E9EBF0 (Gris Azulado Tenue). Color base para el fondo de la aplicación.

Contenedor de Contenido (Canvas): #FFFFFF (Blanco). Fondo para todas las áreas de trabajo, tablas y formularios.

Colores de Semántica (Status):

Success: #5AB6AD

Warning/Warning: #E67E22

Info: #2E4A7D

Danger/Alert: #F39C12

2. Layout & Estructura Global

Navegación y Contenedores

Sidebar Maestro: Siempre en Color Primario. Debe soportar estados "Colapsado" (solo iconos) y "Expandido" (icono + texto en dorado).

Efecto de Superposición: El contenedor principal (Main_Canvas) debe dar la sensación de estar por encima del fondo marino. Para ello, aplicar un radio de borde superior izquierdo de 40px en el punto de encuentro con el sidebar.

Header de Acción: Fondo transparente o blanco con backdrop-filter: blur para elementos de búsqueda global y perfil de usuario.

3. Componentes de UI Estándar

A. Cards de KPI e Indicadores

Cualquier métrica o dato clave (KPI) debe presentarse en este formato:

Elevación: Sombra suave (shadow-lg) para despegar del fondo gris.

Bordes: Radio de 12px (rounded-xl).

Distribución: * Icono representativo dentro de un contenedor cuadrado con el color de estado correspondiente.

Etiqueta de categoría en la esquina superior derecha (Gris #64748B, Small, Uppercase).

Valor principal en tipografía destacada (Bold, Color Primario).

B. Sistema de Tablas y Listados de Datos

Cabeceras: Texto en gris medio, negrita, tamaño 12px.

Filas: Alternar colores muy sutiles o usar bordes inferiores finos (border-b). Espaciado vertical generoso (mínimo 16px).

Acciones: Los botones de acción dentro de tablas deben ser discretos, preferentemente iconos o texto sin relleno.

C. Navegación por Pestañas (Tabs)

Estilo: Texto plano con un indicador inferior sólido de 2px en Color Secundario para el estado activo.

4. Tipografía y Escala Visual

Fuente Obligatoria: Montserrat (preferida) o Poppins en su defecto. No se permiten otras familias tipográficas.

H1 / Títulos de Módulo: 24px, Semibold, Color Primario.

H2 / Subtítulos: 18px, Medium, Color #1E293B.

Body: 14px - 16px, Regular, Color #334155.

5. Reglas de Experiencia (UX)

Interactividad: Todos los elementos interactivos (Cards, Botones, Filas) deben tener un estado de hover que incluya un cambio sutil de brillo o una elevación física mínima.

Jerarquía Dorada: El dorado (Color Secundario) solo debe usarse para resaltar lo que es importante o está activo. No saturar la interfaz con este color.

Estados Vacíos: Ante la falta de datos, mantener siempre la estructura de los contenedores blancos para no romper la armonía del layout.

