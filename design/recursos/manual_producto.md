# Sistema de Gestión de Despachos — Manual de Producto

> Documento pensado para Gabriel López Vener y su equipo. Explica qué hace el sistema, cómo se usa y para qué sirve cada parte. Sin tecnicismos.

---

## Qué es el sistema

El Sistema de Gestión de Despachos es una aplicación web diseñada especialmente para la firma López Vener & Asoc. Reemplaza las carpetas de Windows, las planillas de Excel y los correos dispersos por una única plataforma centralizada, accesible desde cualquier dispositivo con internet.

Con este sistema podés gestionar todas tus operaciones aduaneras —importaciones, exportaciones y tránsitos— desde que abrís una carpeta hasta que la cerrás, con visibilidad completa del estado, los documentos y los gastos en todo momento.

El sistema está pensado para crecer con vos: hoy lo usás vos y tu equipo, pero en el futuro podría incluir un portal para que tus clientes también consulten el estado de sus operaciones sin tener que llamarte.

---

## Módulos principales

### Clientes

El módulo de Clientes es el punto de partida. Acá registrás a todos los importadores y exportadores con los que trabajás.

Podés cargar los datos completos de cada empresa o persona: razón social, RUT o cédula de identidad, dirección, teléfono y correo. El sistema valida automáticamente que el número de documento sea correcto según las reglas de la DGI uruguaya, así evitás errores de tipeo.

Cada cliente puede tener múltiples contactos. Por ejemplo, para PAWER S.A. podés tener cargada a la contadora, al encargado de depósito y al gerente general, cada uno con su teléfono y correo. Así sabés siempre a quién llamar según el tema.

---

### Carpetas (Operaciones)

Las carpetas son el corazón del sistema. Cada operación aduanera —una importación, una exportación, un tránsito— vive dentro de su propia carpeta digital.

Una carpeta tiene número de expediente, tipo de operación (Importación, Exportación o Tránsito), vía de transporte (Marítima, Terrestre o Aérea) y un estado que refleja en qué etapa del proceso se encuentra. El sistema te guía por los estados del workflow: desde la apertura hasta la liquidación final.

Dentro de cada carpeta encontrás todo lo que necesitás: los documentos, los gastos y el historial completo de cambios. Si alguien de tu equipo modifica algo, queda registrado con fecha, hora y usuario. Nada se pierde.

---

### Documentación

Cada carpeta tiene una pestaña de Documentos donde cargás, organizás y controlás todos los archivos de la operación.

El sistema sabe qué documentos son obligatorios para cada tipo de operación y vía de transporte. Para una Importación Marítima, por ejemplo, te va a pedir el Bill of Lading, la Factura Comercial, el CRT y la Declaración de Aduana. Los documentos opcionales (como el Certificado Fitosanitario) los podés agregar cuando apliquen. Y si tenés algo que no entra en ninguna categoría —una nota, una autorización especial— lo subís como "documento extra" con una descripción libre.

Los documentos con vencimiento muestran una alerta visual cuando están próximos a caducar, así nunca te agarran desprevenido con un certificado vencido.

---

### Configuración

El módulo de Configuración es para el administrador del sistema. Desde acá se gestionan los usuarios y sus permisos, los tipos de documentos requeridos para cada operación, los estados del workflow y otros parámetros del sistema.

Esta sección está pensada para que la use el Jefe o quien cumpla el rol de administrador. Los cambios acá afectan a toda la operativa, así que se accede con permiso especial.

---

## Flujo de una operación típica (Importación)

A continuación, un ejemplo de cómo se vería el día a día con el sistema para una importación marítima.

1. **Apertura de carpeta.** Llegó una mercadería. Vas a "Carpetas" y creás una nueva: seleccionás el cliente (PAWER S.A.), el tipo (Importación), la vía (Marítima) y completás los datos del proveedor y la mercadería.

2. **Carga de documentos.** El cliente te manda el Bill of Lading y la Factura Comercial. Los subís directamente en la pestaña Documentos de esa carpeta. El sistema te muestra cuáles faltan todavía.

3. **Avance del estado.** A medida que la operación avanza —llegada del buque, retiro de aduana, libramiento— vas moviendo la carpeta al estado que corresponde. El sistema registra quién hizo el cambio y cuándo.

4. **Alertas de vencimiento.** Si el Certificado de Origen vence en 15 días, el sistema te avisa con un banner naranja en la carpeta para que puedas renovarlo a tiempo.

5. **Registro de gastos.** A medida que van surgiendo gastos (arancel, flete, despachante, almacenaje), los cargás en la pestaña Gastos para armar la liquidación final al cliente.

6. **Cierre.** Una vez entregada la mercadería y cobrado el servicio, cerrás la carpeta. Queda en el historial, consultable en cualquier momento.

---

## Roles de usuario

### JEFE / SUPER_ADMIN

Tiene acceso completo al sistema. Puede crear y eliminar usuarios, cambiar configuraciones del sistema, ver todas las carpetas de todos los operadores y acceder a reportes globales. Normalmente este rol lo tiene Gabriel.

### Operador

Es el rol del trabajo diario. Puede crear y gestionar carpetas, cargar documentos, registrar gastos y avanzar estados. Puede ver todas las carpetas que le fueron asignadas o a las que tiene acceso según el área (Importaciones, Exportaciones, Administrativo). No tiene acceso a la configuración del sistema.

> En el futuro se prevé agregar un rol **Cliente** para que los importadores/exportadores puedan consultar el estado de sus operaciones a través de un portal externo, sin necesidad de llamar a la firma.

---

## Preguntas frecuentes

**¿Puedo acceder al sistema desde mi celular?**
Sí. El sistema está diseñado para funcionar en cualquier dispositivo: computadora, tablet o celular. La pantalla se adapta automáticamente al tamaño de la pantalla.

**¿Qué pasa si cargo mal el RUT de un cliente?**
El sistema valida el número automáticamente y te avisa antes de guardar si el dígito verificador no corresponde. Así evitás errores que después son difíciles de encontrar.

**¿Se puede recuperar un documento borrado?**
Todo queda registrado en el historial de auditoría. Si algo se borró por error, el administrador puede ver qué pasó y cuándo. La recuperación del archivo depende de la configuración de backup, que se define al implementar el sistema.

**¿Puedo tener varios usuarios trabajando al mismo tiempo?**
Sí. El sistema soporta múltiples usuarios simultáneos. Cada uno ve reflejados los cambios de los demás en tiempo real o al recargar la pantalla.

---

> Este documento está en construcción y se irá completando a medida que el sistema tome forma.
