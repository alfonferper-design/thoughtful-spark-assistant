# Hoja de ruta — cierre de seguridad

- [x] Generar `SESSION_SECRET` (64) y guardar `SITE_PASSWORD` (introducida por el usuario).
- [x] Migración `0001_cerrar_acceso_anonimo_tablas_maestras.sql`: políticas abiertas eliminadas y grants de anon/authenticated revocados (verificado: 42501 permission denied).
- [x] Puerta de clave compartida: sesión cifrada (`gate.server.ts`), funciones `estadoPuerta`/`desbloquearApp`/`bloquearApp`.
- [x] Lecturas y escrituras tras funciones de servidor protegidas (`datos.functions.ts`, service role solo en servidor).
- [x] Rutas bajo layout `_gateado` con redirección a `/unlock` (navegación y carga inicial).
- [x] Formularios de cuentas, categorías y proveedores pasan por funciones protegidas.
- [x] Botón de bloqueo en la cabecera.
- [x] MCP retirado por completo (plugin, rutas, herramientas y dependencia).
- [x] Verificación: build OK, `/` redirige a `/unlock`, clave incorrecta rechazada con mensaje.

Pendiente (bloqueado): prueba del desbloqueo con la clave real — solo el usuario la conoce.

## Motor de pagos y conciliación (Parte 5)

- [x] Tablas `conciliaciones` + `conciliacion_detalle` con RLS cerrada (solo service_role).
- [x] Función SQL `registrar_conciliacion()`: escritura atómica (conciliación + detalle + estado de vencimiento + estado de movimiento + auditoría) con bloqueo de filas.
- [x] Núcleo puro `src/lib/conciliacion.ts`: F-10, F-28, F-29, F-30, F-31, F-32, validarConciliacion y familia documental genérica.
- [x] Panel de pagos en la Ficha de factura con las seis magnitudes y formulario de conciliación.
- [x] Estado de pago de la familia por fila en el listado de facturas (nunca guardado, RB-017).
- [x] `/conciliaciones`: listado de solo lectura.
- [x] Verificado en una transacción deshecha: parcial → total, Regla 7, exceso no autorizado y exceso sin motivo, sin dejar datos.

Fuera de alcance (etapas posteriores): rectificativas/abonos, sugerirConciliaciones(), resumenPagosGlobal() y Dashboard. Deshacer o editar una conciliación no existe en el documento (NO DEFINIDO): no se ha inventado.
