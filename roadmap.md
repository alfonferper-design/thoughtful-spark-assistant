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
