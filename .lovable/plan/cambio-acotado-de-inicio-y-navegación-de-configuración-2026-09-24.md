# Cambio acotado de Inicio y navegación de Configuración

## Resultado
- Convertir la cabecera de `/` de “Configuración inicial” a “Inicio”.
- Sustituir las tres tarjetas grandes por un checklist compacto temporal, visible solo mientras falte alguna cuenta, categoría o proveedor.
- Mantener “Qué viene después” sin cambios.
- Añadir accesos secundarios a Cuentas bancarias y Compromisos fijos dentro de Configuración, reutilizando sus rutas y pantallas actuales.

## Implementación
- En `src/routes/_gateado/index.tsx`, conservar los tres hooks y la condición `total > 0`; mostrar progreso, filas enlazadas y el elemento opcional sin recuento.
- En `src/lib/secciones.ts`, añadir ambos accesos en el orden solicitado y permitir que `moduloDeRuta` reciba un contexto opcional de módulo.
- En `src/components/AppShell.tsx`, leer `desde=configuracion` solo para decidir qué módulo del menú queda activo; añadir ese parámetro únicamente a los dos enlaces duplicados de Configuración.
- No cambiar rutas, consultas, contenidos de otras pantallas, lógica de negocio ni datos.

## Comprobación
- Verificar compilación y tipos mediante el estado automático del proyecto.
- Probar visualmente en escritorio y móvil que el checklist no desborda.
- Comprobar los estados 0/3, 2/3 y 3/3 usando respuestas controladas en el navegador, sin escribir datos reales.
- Comprobar que los cuatro accesos abren las rutas existentes y que el contexto de Configuración solo cambia el menú activo.
