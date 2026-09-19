-- Cierra el acceso directo (anon/authenticated) a las tablas de la app.
-- Toda la lectura y escritura pasará por funciones de servidor protegidas por la clave de la app
-- (cliente con service role, que no está sujeto a RLS).

DROP POLICY IF EXISTS "cuentas abiertas" ON public.cuentas;
DROP POLICY IF EXISTS "categorias abiertas" ON public.categorias;
DROP POLICY IF EXISTS "proveedores abiertos" ON public.proveedores;
DROP POLICY IF EXISTS "auditoria lectura" ON public.auditoria;
DROP POLICY IF EXISTS "auditoria escritura" ON public.auditoria;
DROP POLICY IF EXISTS "configuracion abierta" ON public.configuracion;

REVOKE ALL ON public.cuentas FROM anon, authenticated;
REVOKE ALL ON public.categorias FROM anon, authenticated;
REVOKE ALL ON public.proveedores FROM anon, authenticated;
REVOKE ALL ON public.auditoria FROM anon, authenticated;
REVOKE ALL ON public.configuracion FROM anon, authenticated;

GRANT ALL ON public.cuentas TO service_role;
GRANT ALL ON public.categorias TO service_role;
GRANT ALL ON public.proveedores TO service_role;
GRANT ALL ON public.auditoria TO service_role;
GRANT ALL ON public.configuracion TO service_role;