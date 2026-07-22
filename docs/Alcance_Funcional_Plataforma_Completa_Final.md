# Alcance funcional — Plataforma Completa

**Cliente:** Jaime Inturias  
**Proveedor:** DsDevelop  
**Alcance:** Opción 2 — Plataforma Completa  
**Componentes:** Tickets + E-commerce + Inventario + POS + Caja + Dashboard  
**Plazo contractual de referencia:** 3 meses

## Objetivo

Implementar una plataforma para una sola empresa que permita:

- Administrar y vender entradas para eventos.
- Generar entradas digitales y cortesías.
- Controlar el ingreso mediante códigos QR.
- Comercializar productos físicos.
- Controlar un inventario centralizado.
- Registrar ventas desde un punto de venta.
- Administrar una caja.
- Consultar información operativa desde un dashboard.

---

# 1. Operación general

La plataforma será utilizada por **una sola empresa**.

No existirán organizadores independientes con información separada. Todos los eventos, productos, ventas, usuarios y reportes pertenecerán a la misma empresa.

La plataforma tendrá dos áreas principales:

- Sistema de tickets y eventos.
- Sistema de productos, inventario, POS y caja.

Los pagos se realizarán mediante una integración con la API de un banco. En la primera versión, el banco y sus parámetros quedarán definidos directamente en el código y no podrán cambiarse desde el panel administrativo. La integración estará separada de las demás funciones para poder reemplazarla posteriormente sin modificar los módulos de tickets, e-commerce o POS.

---

# 2. Usuarios y permisos

## Sistema de tickets

### Administrador

Podrá:

- Administrar eventos.
- Administrar tipos de entradas y precios.
- Administrar planos y ubicaciones.
- Administrar usuarios del sistema de tickets.
- Consultar ventas, asistentes e ingresos.
- Generar entradas.
- Generar cortesías.
- Anular entradas cuando corresponda.
- Consultar el historial de accesos.
- Consultar incidencias de pagos y devoluciones manuales.
- Configurar las funciones generales del módulo.

### Boletero

Este rol estará pensado para los puestos físicos de venta de entradas.

Podrá:

- Buscar eventos habilitados.
- Abrir el mapa del evento.
- Seleccionar tipos de entrada y ubicaciones.
- Registrar una venta rápida.
- Generar entradas sin exigir todos los datos solicitados en una compra realizada por el cliente.
- Registrar solamente los datos mínimos necesarios para completar la venta física.
- Generar entradas de cortesía cuando tenga autorización.
- Consultar y reenviar las entradas que haya generado.

No podrá modificar la configuración general de los eventos ni administrar usuarios.

### Escaneador

Podrá únicamente:

- Ingresar al módulo de control de acceso.
- Seleccionar el evento asignado.
- Escanear entradas.
- Confirmar si un QR es válido.
- Registrar el uso de un cupo.
- Ver cuántos cupos quedan disponibles.
- Detectar códigos agotados, anulados o incorrectos.
- Buscar una entrada manualmente cuando el código no pueda escanearse.

No podrá crear eventos, generar entradas, modificar ventas ni acceder a información administrativa.

## Punto de venta

### Administrador

Podrá:

- Administrar productos y categorías.
- Administrar precios y costos.
- Administrar inventario.
- Registrar ventas.
- Consultar ventas y movimientos.
- Abrir y cerrar caja.
- Registrar ingresos y egresos autorizados.
- Administrar vendedores.
- Consultar el dashboard.

### Vendedor

Podrá:

- Acceder al punto de venta.
- Buscar productos.
- Agregar productos a una venta.
- Registrar ventas mediante QR.
- Consultar las operaciones que tenga permitidas.

No podrá modificar configuraciones generales, costos, usuarios o permisos.

## Compradores

No será obligatorio crear una cuenta para comprar.

El comprador podrá:

- Ingresar directamente al catálogo y al mapa del evento.
- Seleccionar sus propias ubicaciones.
- Completar la compra sin depender de un boletero.
- Comprar como invitado.
- Crear una cuenta de manera opcional.
- Guardar sus datos para futuras compras.
- Consultar sus entradas y pedidos cuando tenga una cuenta.

Los datos mínimos del comprador serán:

- Nombre.
- Teléfono.
- Correo electrónico.
- Carnet de identidad.

---

# 3. Catálogo público de eventos

Los compradores podrán:

- Ver los eventos publicados.
- Buscar eventos por nombre.
- Filtrar eventos por fecha, categoría, ubicación o disponibilidad.
- Ver el título, descripción, fecha, hora, ubicación e imágenes.
- Consultar los tipos de entrada disponibles.
- Ver precios y disponibilidad.
- Seleccionar la cantidad de entradas.
- Seleccionar sectores, mesas, sillas, butacas o ubicaciones generales.
- Comprar sin crear una cuenta.
- Utilizar la plataforma desde una computadora o teléfono.

---

# 4. Administración de eventos

El administrador podrá:

- Crear eventos.
- Editar eventos.
- Registrar nombre, descripción, fechas, horarios, ubicación e imágenes.
- Definir la capacidad.
- Guardar un evento como borrador.
- Publicar, finalizar o cancelar un evento.
- Duplicar la configuración de un evento anterior.
- Crear diferentes tipos de entrada.
- Definir precios y cantidades.
- Configurar fechas de inicio y cierre de venta.
- Crear códigos promocionales.
- Consultar entradas vendidas y disponibles.
- Consultar compradores y asistentes.
- Reenviar entradas al comprador.

Los cambios realizados en un evento no modificarán las entradas ni ubicaciones que ya hayan sido vendidas.

La política para cancelar eventos todavía deberá definirse.

---

# 5. Planos y distribución de recintos

La estructura exacta de los cinco planos se definirá posteriormente.

La plataforma deberá contar con una arquitectura que permita:

- Leer una plantilla de plano en un formato estructurado, por ejemplo JSON.
- Generar visualmente el mapa a partir de esa plantilla.
- Crear planos con butacas, sillas, mesas, sectores o una combinación de todos estos elementos.
- Adaptarse a diferentes distribuciones sin cambiar el código de la plataforma.
- Definir identificadores únicos para cada ubicación.
- Definir capacidades por sector, mesa o área.
- Asociar ubicaciones con tipos de entrada y precios.
- Cargar y reutilizar diferentes plantillas de planos.
- Utilizar un mismo plano en diferentes eventos sin compartir sus reservas o ventas.

El administrador podrá:

- Cargar una plantilla de plano como archivo desde el panel administrativo.
- Reemplazar o desactivar una plantilla cargada.
- Asociar un plano con un evento.
- Activar u ocultar sectores.
- Activar u ocultar mesas, sillas, butacas o ubicaciones.
- Bloquear ubicaciones para producción, invitados o cortesías.

El comprador podrá distinguir visualmente las ubicaciones:

- Disponibles.
- Seleccionadas.
- Reservadas.
- Vendidas.
- Bloqueadas.

Una misma ubicación no podrá estar disponible para dos compras al mismo tiempo.

No se incluye un editor visual para dibujar planos directamente dentro de la plataforma. Los planos se prepararán como archivos en el formato definido y podrán cargarse desde administración sin editar el código.

---

# 6. Reserva de ubicaciones

La reserva funcionará en dos etapas.

## Selección temporal

Cuando el comprador seleccione butacas, mesas o sillas:

- Las ubicaciones quedarán bloqueadas durante **5 minutos**.
- Durante ese tiempo, otro comprador no podrá seleccionarlas.
- El comprador deberá confirmar que desea continuar con la reserva.
- Si no confirma dentro de los 5 minutos, las ubicaciones volverán a estar disponibles.

## Reserva pendiente de pago

Después de confirmar la reserva:

- El comprador tendrá **20 minutos** para realizar el pago.
- Durante esos 20 minutos, las ubicaciones permanecerán reservadas.
- Si el pago se confirma, la reserva se convertirá en una compra.
- Si el pago no se confirma dentro del plazo, la reserva se eliminará y las ubicaciones volverán a estar disponibles.

La plataforma mostrará claramente el tiempo restante en ambas etapas.

Durante la espera del pago:

- La plataforma utilizará WebSockets para recibir y mostrar la confirmación del pago en tiempo real.
- Se mostrará el botón **Ya realicé el pago** para consultar directamente el estado cuando la página no haya actualizado la respuesta.
- Cuando el pago sea confirmado, se generará la entrada y se enviará al correo registrado.

---

# 7. Pagos QR mediante API bancaria

La plataforma se integrará con la API de un banco para:

- Solicitar un pago.
- Generar un código QR.
- Mostrar el monto, referencia y tiempo disponible.
- Consultar el estado del pago.
- Recibir la confirmación automática del banco.
- Asociar la confirmación con la compra correspondiente.
- Evitar que una misma confirmación sea procesada más de una vez.
- Guardar la referencia, monto, estado y fecha de la transacción.
- Consultar pagos desde el panel administrativo.

El banco utilizado podrá variar. Por este motivo, las funciones de pago deberán estar separadas del resto de la plataforma para permitir cambiar la integración sin modificar los módulos de tickets, e-commerce o POS.

El cliente deberá proporcionar:

- El banco seleccionado.
- La documentación de la API.
- Las credenciales necesarias.
- Los datos requeridos para utilizar el servicio.

## Pago confirmado fuera de tiempo

Cuando la reserva haya vencido y el banco confirme el pago después de los 20 minutos:

- La plataforma no volverá a asignar automáticamente las ubicaciones liberadas.
- No se generará una entrada de manera automática.
- El pago quedará registrado como una incidencia que requiere atención.
- El historial guardará la reserva, el vencimiento, la confirmación bancaria y las acciones realizadas.
- El comprador verá un botón para comunicarse con soporte.
- El personal autorizado podrá revisar el historial y comprobar que el pago fue recibido.
- La devolución del dinero se realizará manualmente después de la revisión.

Este proceso evitará entregar una ubicación que ya pudo haber sido reservada o vendida a otra persona.

---

# 8. Entradas digitales

Después de confirmar el pago, la plataforma podrá:

- Generar una entrada digital para la compra.
- Crear un identificador seguro para cada entrada o grupo de cupos.
- Generar un código QR.
- Mostrar el evento, fecha, tipo de entrada y ubicaciones adquiridas.
- Enviar la entrada al correo registrado.
- Mostrarla dentro de la cuenta del comprador.
- Permitir su visualización desde un teléfono.
- Reenviarla cuando sea necesario.

Una entrada digital podrá contener:

- Un solo cupo.
- Varios cupos dentro del mismo código QR.

Cuando un QR tenga varios cupos:

- Podrá escanearse hasta completar la cantidad de cupos comprados.
- Cada acceso consumirá un cupo.
- La plataforma mostrará los cupos utilizados y los cupos restantes.
- El QR podrá compartirse únicamente con las personas elegidas por el comprador.
- La entrada mostrará un mensaje aclarando que el comprador es responsable de compartir el QR y que el acceso estará limitado a la cantidad de cupos disponibles.

Las entradas podrán estar activas, agotadas o anuladas.

No se incluirá inicialmente un proceso formal para cambiar el titular de una entrada.

---

# 9. Entradas de cortesía

El administrador o un boletero autorizado podrá generar entradas de cortesía.

Las cortesías podrán:

- Utilizar cualquier ubicación disponible.
- Tener una entrada digital y un código QR.
- Ser enviadas por correo.
- Ser escaneadas de la misma forma que una entrada normal.
- Quedar registradas como cortesías.

Las cortesías:

- No se registrarán como compras.
- No generarán ingresos.
- No aumentarán las ventas del evento.
- Sí ocuparán la ubicación seleccionada.
- Sí reducirán la disponibilidad del evento.

---

# 10. Control de acceso

El usuario con rol Escaneador podrá:

- Seleccionar el evento asignado.
- Leer el QR con la cámara de un teléfono.
- Confirmar una entrada válida.
- Registrar el uso de un cupo.
- Mostrar cuántos cupos quedan disponibles.
- Detectar un QR que ya haya utilizado todos sus cupos.
- Mostrar el historial de ingresos registrados.
- Detectar códigos inválidos.
- Detectar entradas anuladas.
- Detectar entradas correspondientes a otro evento.
- Buscar una entrada manualmente.
- Ver la cantidad de entradas utilizadas.

El control de acceso requerirá conexión a internet.

No se incluye funcionamiento sin conexión.

---

# 11. Catálogo de productos

El administrador podrá:

- Crear categorías.
- Editar, ordenar, ocultar o desactivar categorías.
- Crear productos.
- Seleccionar si un producto será simple o utilizará variantes.
- Registrar la información correspondiente según el tipo de producto.
- Editar productos y variantes.
- Desactivar productos sin eliminar su historial.
- Administrar imágenes, precios, códigos y stock según el tipo de producto.
- Publicar u ocultar productos.
- Marcar productos como destacados.
- Definir un nivel de stock bajo.

## Variantes de productos

La plataforma manejará las diferencias de un producto mediante un concepto general de **variantes**.

Al crear un producto se seleccionará uno de estos tipos:

### Producto simple

El producto tendrá directamente:

- Nombre.
- Imagen o galería.
- Precio de venta.
- Precio de compra.
- Stock.
- Código interno.

### Producto con variantes

El producto funcionará como un contenedor y no tendrá datos de venta propios. Cada variante podrá tener:

- Nombre diferente.
- Imagen diferente.
- Precio de venta.
- Precio de compra.
- Stock propio.
- Código interno propio.

En el e-commerce y en el punto de venta:

- Si el producto es simple, se seleccionará directamente.
- Si utiliza variantes, primero se mostrarán las variantes disponibles.
- El comprador o vendedor deberá elegir una variante antes de agregarla a la compra.
- El inventario se controlará de manera independiente para cada variante.

---

# 12. Tienda pública

Los compradores podrán:

- Ver los productos publicados.
- Navegar por categorías.
- Buscar productos por nombre o descripción.
- Filtrar por categoría.
- Filtrar por precio.
- Ver imágenes, descripción, precio y disponibilidad.
- Ver productos destacados.
- Agregar productos al carrito.
- Utilizar la tienda desde una computadora o teléfono.

Los productos sin stock podrán ocultarse automáticamente.

---

# 13. Carrito y compra de productos

El comprador podrá:

- Agregar productos al carrito.
- Cambiar cantidades.
- Eliminar productos.
- Ver el subtotal y total.
- Registrar sus datos de contacto.
- Comprar como invitado.
- Utilizar una cuenta opcional para guardar sus datos.
- Generar el pago mediante QR.
- Recibir un número de pedido.
- Consultar el estado del pedido cuando tenga una cuenta.

Antes del pago:

- La plataforma creará un pedido pendiente.
- El stock quedará reservado durante el tiempo definido.

Cuando el pago se confirme:

- El pedido cambiará a pagado.
- El inventario será descontado.
- El comprador recibirá una confirmación.

Cuando el pago venza:

- El pedido pendiente será cancelado.
- El stock reservado volverá a estar disponible.

No se configurarán zonas ni tarifas de delivery en la primera versión.

La coordinación de entrega o recojo de productos se realizará fuera de la plataforma, salvo que posteriormente se defina una ampliación.

---

# 14. Gestión de pedidos

El administrador podrá:

- Ver la lista de pedidos.
- Buscar por número, cliente, correo o teléfono.
- Filtrar por fecha, estado de pago y estado del pedido.
- Ver productos, cantidades, total, pago e historial.
- Cambiar el estado del pedido.
- Consultar pedidos que requieren atención.
- Recibir un aviso cuando se confirme un nuevo pedido.

Los pedidos utilizarán solamente los estados necesarios:

- Pendiente de pago.
- Pagado.
- Entregado.
- Cancelado.

Las reglas para editar o cancelar pedidos pagados se definirán antes de habilitar esas acciones.

---

# 15. Inventario centralizado

La tienda web y el punto de venta utilizarán el mismo inventario.

La plataforma permitirá:

- Registrar productos y existencias.
- Consultar stock disponible, reservado y total.
- Registrar entradas de inventario.
- Registrar salidas de inventario.
- Registrar reservas.
- Realizar ajustes indicando un motivo.
- Evitar ventas por encima del stock disponible.
- Reservar stock durante un pago pendiente.
- Descontar stock por una compra web.
- Descontar stock por una venta en el POS.
- Reponer stock cuando un pedido sea cancelado según la regla definida.
- Ocultar productos agotados.
- Identificar productos con stock bajo.
- Enviar alertas de stock bajo.
- Consultar el historial de movimientos.
- Filtrar movimientos por producto, fecha, tipo y usuario.
- Liberar reservas vencidas.

---

# 16. Punto de venta

El punto de venta tendrá dos roles: Administrador y Vendedor.

El administrador o vendedor autorizado podrá:

- Buscar productos por nombre, categoría o código.
- Agregar productos a una venta.
- Cambiar cantidades.
- Retirar productos antes de confirmar.
- Ver el resumen y total.
- Registrar una venta.
- Asociar un cliente cuando sea necesario.
- Consultar el número y resultado de la operación.

El único medio de pago aceptado inicialmente en el POS será **QR**.

Cada venta confirmada:

- Descontará el inventario central.
- Quedará asociada con el vendedor.
- Se registrará en la caja.
- Quedará guardada en el historial.

Las reglas para editar o cancelar ventas confirmadas todavía deberán definirse.

---

# 17. Caja

La primera versión utilizará **una sola caja**.

El administrador podrá:

- Abrir la caja.
- Registrar fecha y hora de apertura.
- Consultar las ventas registradas.
- Consultar los pagos QR del POS.
- Registrar ingresos manuales autorizados.
- Registrar egresos manuales autorizados.
- Ver el total esperado.
- Cerrar la caja.
- Consultar el historial de aperturas y cierres.
- Ver el detalle de los movimientos.

Una caja cerrada no podrá recibir movimientos normales.

---

# 18. Dashboard

El dashboard podrá mostrar:

- Ventas totales por periodo.
- Ingresos por eventos.
- Entradas vendidas.
- Entradas de cortesía.
- Entradas utilizadas.
- Disponibilidad de entradas.
- Ventas de productos.
- Pedidos pendientes.
- Productos con stock bajo.
- Estado de la caja.
- Usuario que abrió la caja.
- Accesos directos a eventos, pedidos, POS, inventario y caja.

Los indicadores podrán filtrarse por fecha.

## Utilidad de productos

La utilidad de una venta de productos se calculará de la siguiente forma:

`Utilidad = precio de venta - precio de compra`

Cuando se vendan varias unidades, la diferencia se multiplicará por la cantidad vendida.

La utilidad no se aplicará automáticamente a las entradas de eventos mientras no se definan costos específicos para ese módulo.

Cada usuario verá solamente la información permitida por su rol.

---

# 19. Notificaciones y correos

La plataforma enviará los correos necesarios para los principales procesos.

Podrán incluir:

- Verificación de una cuenta opcional.
- Recuperación de contraseña.
- Confirmación de una reserva.
- Confirmación de pago.
- Envío de entradas digitales.
- Reenvío de entradas.
- Confirmación de un pedido de productos.
- Avisos por cambios importantes en el estado de un pedido.
- Alertas de stock bajo para los responsables.

Los correos utilizarán la identidad visual y el remitente definidos por la empresa.

No se incluyen inicialmente notificaciones por WhatsApp o SMS.

---

# 20. Administración general

El administrador podrá configurar:

- Nombre de la empresa.
- Logotipo.
- Datos de contacto.
- Moneda.
- Zona horaria.
- Correos remitentes.
- Tiempo de selección temporal de ubicaciones.
- Tiempo disponible para pagar una reserva.
- Términos y condiciones.
- Política de privacidad.
- Usuarios internos.
- Roles y permisos.
- Estado de los usuarios.

Los tiempos iniciales serán:

- 5 minutos para confirmar la selección de ubicaciones.
- 20 minutos para realizar el pago después de confirmar la reserva.

---

# 21. Configuración inicial

Para iniciar la operación se configurarán:

- Identidad visual.
- Logotipo y colores.
- Empresa operadora.
- Administradores iniciales.
- Boleteros iniciales.
- Escaneadores iniciales.
- Vendedores iniciales.
- Roles y permisos.
- Plantillas de planos disponibles al momento del lanzamiento.

No se incluye una carga inicial de una cantidad determinada de productos.

Los productos, precios, costos y existencias podrán ser registrados posteriormente desde el panel administrativo.

No se incluye una migración masiva desde otros sistemas.

---

# 22. Estados principales

La plataforma utilizará únicamente los estados necesarios para operar.

## Eventos

- Borrador.
- Publicado.
- Finalizado.
- Cancelado.

## Reservas de entradas

- Selección temporal.
- Pendiente de pago.
- Pagada.
- Vencida.

## Pagos

- Pendiente.
- Pagado.
- Vencido.

Un pago recibido después del vencimiento se manejará como una incidencia de soporte, no como un estado normal de la reserva.

## Entradas

- Activa.
- Agotada.
- Anulada.

## Pedidos de productos

- Pendiente de pago.
- Pagado.
- Entregado.
- Cancelado.

## Caja

- Abierta.
- Cerrada.

---

# 23. Elementos no incluidos

No se incluyen inicialmente:

- Más de cinco plantillas de planos, salvo ampliación.
- Editor visual para dibujar planos desde la plataforma.
- Aplicaciones móviles nativas.
- Escaneo de entradas sin conexión.
- Reembolsos automáticos mediante la API bancaria.
- Gestión de contracargos.
- Facturación electrónica.
- Integración tributaria.
- Integración contable.
- Cálculo automático de tarifas de delivery.
- Integración con empresas de delivery.
- Seguimiento GPS de entregas.
- Notificaciones por WhatsApp o SMS.
- Impresoras fiscales o hardware especializado.
- Múltiples almacenes o sucursales.
- Múltiples cajas simultáneas.
- Transferencias de stock entre sucursales.
- Migración masiva de información.
- Programa de puntos o fidelización.
- Marketplace con varios vendedores.
- Venta en múltiples monedas.
- Integraciones externas no descritas.

---

# 24. Resultado funcional esperado

La plataforma permitirá:

- Administrar eventos desde una sola empresa.
- Permitir que el comprador abra el mapa, seleccione ubicaciones y compre sin depender de un boletero.
- Permitir ventas rápidas desde puestos físicos mediante el rol Boletero.
- Generar cortesías sin registrarlas como ingresos.
- Cargar plantillas de planos desde administración sin editar el código.
- Crear mapas con butacas, sillas, mesas, sectores o combinaciones de estos elementos.
- Reservar ubicaciones durante 5 minutos.
- Mantener una reserva durante 20 minutos para completar el pago.
- Recibir confirmaciones de pago en tiempo real mediante WebSockets.
- Consultar manualmente el pago mediante el botón **Ya realicé el pago**.
- Cobrar mediante una API bancaria y código QR.
- Registrar pagos recibidos fuera de tiempo y derivarlos a soporte para devolución manual.
- Mantener un historial de las acciones relacionadas con reservas, pagos y devoluciones.
- Generar y enviar entradas digitales por correo.
- Utilizar un mismo QR para uno o varios cupos.
- Registrar cada acceso hasta agotar los cupos disponibles.
- Administrar productos simples y productos con variantes.
- Controlar precio, imagen, código y stock por variante.
- Vender productos por internet y mediante POS.
- Compartir un único inventario entre la tienda y el POS.
- Registrar ventas del POS mediante QR.
- Administrar una sola caja.
- Calcular la utilidad de las ventas de productos.
- Consultar indicadores desde un dashboard.
- Permitir compras con o sin una cuenta.
- Administrar usuarios con permisos diferentes para tickets y POS.
