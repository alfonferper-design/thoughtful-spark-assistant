# ESPECIFICACIÓN MAESTRA PARA LOVABLE
## Plataforma Financiera Farmacia — Núcleo + Motores (Fase 1 + Fase 2)

**Documento generado por:** Claude, a partir de una lectura completa y literal del código fuente del artefacto Claude vigente.
**Artefacto fuente:** `https://claude.ai/artifact/DyoHmRCh9sN8eEFiZfsE4a`
**Versión leída:** `1789765444-8ee5` (contrato de artefacto `0.2.52`)
**Tamaño del código fuente:** 367,6 KB · 4.628 líneas (HTML + CSS + JavaScript en un único archivo, sin dependencias externas)
**Fecha de esta lectura:** 2026-09-19
**Título interno del sistema (tal cual aparece en el `<h1>`):** "Plataforma Financiera Farmacia — Núcleo + Motores" con el subtítulo "Fase 1 + Fase 2, sin OCR/IA/SOE"
**Estado del sistema según su propio código:** "Datos y reglas (Fase 1) + motores de cálculo determinista (Fase 2). La UX final es Fase 4." — **NO DEFINIDO**: el código no contiene ninguna definición de qué es "Fase 3" (aunque sí existen comentarios "FASE 3" dentro de la suite de pruebas, ver Parte 14) ni "Fase 4"; son referencias a un plan de trabajo externo al propio artefacto.

---

## CÓMO LEER ESTE DOCUMENTO (reglas seguidas en toda su redacción)

Este documento describe **exclusivamente** lo que existe, literalmente, en el código fuente del artefacto citado arriba. No se ha inventado ningún dato, campo, función, regla, pantalla ni comportamiento. Donde el artefacto no define algo, se indica **`NO DEFINIDO`**. Donde el artefacto es ambiguo o dependería de una decisión no tomada, se indica **`AMBIGUO — REQUIERE DECISIÓN`**. Donde se ha detectado una incoherencia interna del propio código (dos piezas del artefacto que se contradicen entre sí), se indica **`CONTRADICCIÓN DETECTADA`**.

Cada afirmación de este documento pertenece a una de estas categorías (terminología del proyecto FARMATRACK, aplicada aquí):
- **CONFIRMADO** — leído literalmente del código fuente del artefacto.
- **CALCULADO** — derivado matemáticamente a partir de datos confirmados (p. ej. recuentos de líneas de código).
- **SUPUESTO** — una afirmación del propio código que es una hipótesis de quien lo escribió, no un hecho verificado por quien redacta este informe (se señala expresamente cada vez que ocurre).
- **AMBIGUO / NO DEFINIDO / CONTRADICCIÓN DETECTADA** — como se ha explicado arriba.

No se ha modificado el artefacto original en ningún momento durante la elaboración de este documento. No se ha ejecutado la suite de pruebas interna del artefacto (pestaña "Validación Fase 2") como parte de la elaboración de este informe; su contenido se documenta en la Parte 14 a partir de la lectura del código, no de una ejecución real — esto se señala explícitamente donde corresponde.

---

# PARTE 1 — MAPA GENERAL

## 1.1 Propósito del sistema (tal cual lo expresa el propio código)

- Cabecera literal (`<h1>`): *"Plataforma Financiera Farmacia — Núcleo + Motores"*, badge: *"Fase 1 + Fase 2, sin OCR/IA/SOE"*.
- Descripción literal (`<p>` bajo el título): *"Datos y reglas (Fase 1) + motores de cálculo determinista (Fase 2). La UX final es Fase 4."*
- No existe ningún texto adicional de "misión", "propósito de negocio" o "audiencia objetivo" dentro del propio artefacto — ese contexto vive en instrucciones externas al artefacto (el proyecto FARMATRACK), no en su código. `NO DEFINIDO` dentro del artefacto mismo.

## 1.2 Usuarios

- El sistema **no tiene autenticación real**. Existe un único campo de identidad, `config/actor` (documento único, no colección), con un solo campo `nombre` (string), editable desde un `<input>` en la cabecera de la aplicación, por defecto `"Alfonso"`.
- Texto literal junto a ese campo: *"— este nombre queda registrado en la auditoría de cambios. Identidad de usuario real: pendiente de futura capa de autenticación."* — el propio artefacto declara explícitamente esto como **PENDIENTE**.
- Todas las acciones que generan auditoría usan `currentActor()`, que devuelve `CACHE.actor || 'Alfonso'`.
- No hay roles, permisos ni perfiles de usuario. Un único "actor" de texto libre para todo el sistema. `NO DEFINIDO`: control de acceso, multiusuario real, permisos diferenciados.

## 1.3 Módulos / pantallas (`SECTIONS`, en el orden exacto del array `SECTIONS` del código)

| # | id interno | Etiqueta en el menú | Tipo de pantalla |
|---|---|---|---|
| 1 | `config-inicial` | Configuración inicial | Panel guía/checklist, sin escritura de datos propia |
| 2 | `diagnostico` | ⚠ Diagnóstico | Panel de salud del sistema, migraciones y limpieza |
| 3 | `dashboard` | Dashboard | Panel de KPIs (solo lectura) |
| 4 | `comparativa` | Comparativa | Formulario + resultado de comparación de periodos |
| 5 | `informes` | Informes | Formulario de filtros + informes agregados |
| 6 | `cuentas` | Cuentas | Alta + listado de `CuentaBancaria` |
| 7 | `categorias` | Categorías | Alta + listado de `Categoria`/`Subcategoria` |
| 8 | `proveedores` | Proveedores | Alta + listado de `Proveedor` |
| 9 | `movimientos` | Movimientos | Alta + listado de `Movimiento` |
| 10 | `transferencias` | Transferencias | Alta + listado de `Transferencia` |
| 11 | `facturas` | Facturas | Alta + listado/índice de `Factura` |
| 12 | `ficha` | Ficha de factura | Espacio de trabajo de UNA factura (documento, líneas, relacionados, pagos) |
| 13 | `compromisos` | Compromisos fijos | Alta + listado de `CompromisoFijo` |
| 14 | `vencimientos` | Vencimientos | Alta + listado de `Vencimiento` |
| 15 | `snapshots` | Saldo bancario | Alta + listado de `SnapshotSaldoBancario` |
| 16 | `conciliaciones` | Conciliación | Sugerencias + alta + listado de `Conciliacion` |
| 17 | `auditoria` | Auditoría | Listado de solo lectura de `Auditoria` |
| 18 | `backup` | Backup / Exportación | Generación de paquete ZIP de exportación |
| 19 | `validacion` | Validación Fase 2 | Ejecución de la suite de pruebas internas |

**Pantalla de arranque:** `showSection('diagnostico')` — la aplicación abre siempre en "Diagnóstico", no en "Dashboard". CONFIRMADO (línea `init()`).

## 1.4 Navegación

- Aplicación de una sola página (SPA), sin router de URL: no hay hashes ni rutas — todo el estado de navegación vive en la variable JS `currentSection`. `NO DEFINIDO`: enlaces profundos (deep links) a una pantalla o a una factura concreta.
- `showSection(id)` reconstruye por completo el `<section>` activo cada vez que se llama (destruye y vuelve a crear el DOM de la pantalla). Es también la función que usan los listeners en tiempo real (`onSnapshot`) para refrescar la pantalla activa (`rerenderCurrent()`), salvo mientras `testsRunning === true` (ver Parte 14).
- Navegación cruzada explícita encontrada en el código:
  - Botón "Abrir ficha" en el índice de Facturas → `abrirFichaFactura(id)` + `showSection('ficha')`.
  - Botón "Ver"/"Aquí" en el panel de Documentos relacionados de la Ficha → cambia la factura activa de la ficha y permanece en `ficha`.
  - Botón "← Volver al índice de facturas" en la Ficha → `showSection('facturas')`.
  - Botones "Ir a…" en Configuración inicial → saltan a la pantalla correspondiente.
- Mientras se ejecuta la suite de pruebas (`testsRunning=true`), **todos los botones del menú quedan deshabilitados** (`nav button.disabled=true`) para impedir navegar fuera de la pantalla de Validación a mitad de una ejecución (motivo documentado en el propio código, ver Parte 14).

## 1.5 Jerarquía APLICACIÓN → MÓDULO → PANTALLA → COMPONENTE → FUNCIÓN → DATOS

```
APLICACIÓN: Plataforma Financiera Farmacia — Núcleo + Motores
│
├─ MÓDULO: Configuración / Diagnóstico
│   ├─ PANTALLA config-inicial
│   │   └─ COMPONENTE: checklist de 5 pasos (cuentas, categorías, métodos de cobro/pago
│   │      [fijo, no dado de alta], proveedores, compromisos) → lee recuentos de CACHE
│   ├─ PANTALLA diagnostico
│   │   ├─ COMPONENTE "Salud documental" → FUNCIÓN saludDocumental() → DATOS: facturas, documentos
│   │   ├─ COMPONENTE "Informe de estado del almacenamiento" → FUNCIÓN informeEstadoAlmacenamiento()
│   │   │   → DATOS: las 13 colecciones + categorías/subcategorías por separado
│   │   ├─ COMPONENTE "Herramienta de limpieza" → FUNCIÓN candidatosLimpieza() /
│   │   │   ejecutarLimpiezaHuerfanos() → DATOS: todas las colecciones (detección de huérfanos)
│   │   └─ COMPONENTE "Migración ETAPA D" → FUNCIÓN necesitaMigracionEtapaD() /
│   │       migrarFacturasEtapaD() → DATOS: facturas
│   └─ (config/actor, config/conciliacion son documentos de configuración transversales,
│       no una pantalla propia; se editan desde la cabecera y desde "Conciliación" respectivamente)
│
├─ MÓDULO: Panel de control (lectura agregada)
│   ├─ PANTALLA dashboard → ver Parte 9 (mapa completo de KPIs)
│   ├─ PANTALLA comparativa → FUNCIÓN compararPeriodos() → DATOS: movimientos
│   └─ PANTALLA informes → FUNCIONES movimientosFiltrados()/agruparImporte()/informeVencimientos()
│
├─ MÓDULO: Maestros
│   ├─ PANTALLA cuentas → entidad CuentaBancaria
│   ├─ PANTALLA categorias → entidad Categoria (autorreferencial, 2 niveles)
│   └─ PANTALLA proveedores → entidad Proveedor
│
├─ MÓDULO: Tesorería
│   ├─ PANTALLA movimientos → entidad Movimiento
│   ├─ PANTALLA transferencias → entidad Transferencia (+ 2 Movimiento emparejados) → FUNCIÓN crearTransferencia()
│   ├─ PANTALLA snapshots → entidad SnapshotSaldoBancario → FUNCIÓN diferenciasPorCuenta()
│   └─ PANTALLA conciliaciones → entidad Conciliacion (+ subcolección detalle) →
│       FUNCIONES sugerirConciliaciones() / registrarConciliacion() / validarConciliacion()
│
├─ MÓDULO: Facturación
│   ├─ PANTALLA facturas (índice) → entidad Factura → FUNCIONES estadoDuplicadoFactura(),
│   │   estadoPagoFactura(), resumenFiscalFactura()
│   └─ PANTALLA ficha (espacio de trabajo de una factura) → FUNCIÓN maestra datosFichaFactura()
│       ├─ COMPONENTE panel-identificacion-ficha
│       ├─ COMPONENTE panel-doc-factura → entidad Documento → FUNCIÓN subirDocumentoFactura()
│       ├─ COMPONENTE panel-lineas-factura → entidad FacturaLinea →
│       │   FUNCIONES crearLineaFactura()/actualizarLineaFactura()/recalcularImportesLineaFactura()/
│       │   reordenarLineasFactura()/eliminarLogicamenteLineaFactura()
│       ├─ COMPONENTE panel-relacionados-factura → FUNCIONES familiaDocumentalFactura(),
│       │   posicionNetaFactura(), pendienteNetoFamiliaFactura(), crearRectificativaFactura(),
│       │   crearAbonoFactura()
│       └─ COMPONENTE panel-pagos-factura → FUNCIÓN maestra posicionPagoFactura(),
│           estadoPagoFamiliaFactura(), detalleVencimiento(), crearVencimientoFactura()
│
├─ MÓDULO: Compromisos y vencimientos
│   ├─ PANTALLA compromisos → entidad CompromisoFijo (+ subcolección importe_historico) →
│   │   FUNCIONES generarVencimientos(), actualizarImporteCompromiso(), importeVigente()
│   └─ PANTALLA vencimientos (alta manual/listado global) → entidad Vencimiento →
│       FUNCIÓN crearVencimientoValidado()
│
├─ MÓDULO: Trazabilidad
│   └─ PANTALLA auditoria → entidad Auditoria (solo lectura)
│
├─ MÓDULO: Continuidad de negocio
│   └─ PANTALLA backup → FUNCIONES construirBackup(), exportarBackupCompleto(), ZipBuilder, leerZip()
│
└─ MÓDULO: Calidad interna
    └─ PANTALLA validacion → FUNCIÓN runTests() (suite de ~100 casos, ver Parte 14)
```

## 1.6 Funcionalidades / acciones principales por pantalla (resumen; el detalle exhaustivo está en las partes siguientes)

| Pantalla | Acciones de escritura disponibles | Acciones de solo lectura |
|---|---|---|
| config-inicial | Ninguna (solo navegación) | Checklist de progreso |
| diagnostico | Eliminar registros huérfanos/prueba; migrar facturas a ETAPA D; actualizar uso de `assets` | Informe de salud documental, informe de almacenamiento |
| dashboard | Ninguna | Todos los KPIs (ver Parte 9) |
| comparativa | Ninguna (solo genera un informe en pantalla) | Comparación A vs. B |
| informes | Ninguna | Informes agregados por filtro |
| cuentas | Alta de cuenta | Listado con saldo interno |
| categorias | Alta de categoría/subcategoría | Listado jerárquico |
| proveedores | Alta de proveedor | Listado |
| movimientos | Alta de movimiento | Listado |
| transferencias | Alta de transferencia (crea 2 movimientos) | Listado |
| facturas | Alta de factura; confirmar/descartar posible duplicado; abrir ficha | Listado/índice con estados calculados |
| ficha | Subir/sustituir documento; crear/editar/recalcular/reordenar/eliminar (lógico) líneas; crear rectificativa/abono; crear vencimiento | Todos los paneles de la ficha |
| compromisos | Alta de compromiso; generar 12 vencimientos; activar/desactivar; actualizar importe futuro | Listado |
| vencimientos | Alta manual de vencimiento | Listado global |
| snapshots | Alta de snapshot de saldo bancario | Tabla de diferencia actual por cuenta |
| conciliaciones | Registrar conciliación; ajustar umbrales de sugerencia | Sugerencias; listado de conciliaciones |
| auditoria | Ninguna (explícitamente solo lectura) | Listado completo |
| backup | Generar y descargar backup ZIP | Descripción del contenido del paquete |
| validacion | Ejecutar pruebas internas | Resultado de la última ejecución |

---

# PARTE 2 — MODELO DE DATOS COMPLETO

## 2.0 Motor de almacenamiento y convenciones globales

- Base de datos tipo documento con colecciones (`db.collection(nombre)`), documentos con `id` autogenerado, y subcolecciones anidadas bajo un documento padre (usadas en `compromisos/{id}/importe_historico` y `conciliaciones/{id}/detalle`).
- Dos documentos de configuración de clave fija fuera de cualquier colección de entidades de negocio: `config/actor` y `config/conciliacion`.
- **Campo transversal `entorno`**: presente en (casi) todo documento de negocio. Valores: `'produccion'` | `'prueba'`. CONFIRMADO. Su ausencia en un documento (dato anterior a la introducción de este campo) se interpreta como producción: `function esProduccion(r){ return r && r.entorno!=='prueba'; }`.
- **Campo `_test_run`**: presente solo en documentos creados por la suite de pruebas interna (valor = un identificador de ejecución tipo `'PRUEBA-'+Date.now()`). Nunca aparece en datos reales.
- **Borrado físico vs. lógico**: el sistema, como regla general, **no borra documentos de producción**. La única función que borra físicamente documentos de negocio es `ejecutarLimpiezaHuerfanos()` (pantalla Diagnóstico), y solo actúa sobre registros que ya han sido detectados como de prueba, con `_test_run`, con nombre que empieza por "PRUEBA", o huérfanos (referencian una entidad que ya no existe) — nunca sobre datos de producción sanos. La suite de pruebas también borra físicamente, pero únicamente lo que ella misma creó en esa misma ejecución (ver Parte 14). Las líneas de factura usan baja **lógica** (`estado_linea:'Eliminada'`), nunca borrado físico. Los documentos (`documentos`) nunca pasan a `'Eliminado'`: solo `'Activo'`/`'Sustituido'`.
- **Redondeo monetario**: una única constante centralizada, `TOLERANCIA_REDONDEO_EUR = 0.01` (1 céntimo de euro), y una única función de comparación con tolerancia, `dentroDeTolerancia(a,b)`. Además existe `redondearEuros(n) = Math.round((n||0)*100)/100`, usada para el redondeo de presentación/acumulación (no es una tolerancia, es un redondeo a céntimos).
- **Fechas**: todas las fechas de negocio son cadenas ISO `YYYY-MM-DD` (proceden de `<input type="date">`). Las fechas de auditoría/creación (`fecha`, `created_at`, `updated_at`, `fecha_incorporacion`, `fecha_confirmacion`, `fecha_contabilizacion`) son cadenas ISO 8601 completas (`new Date().toISOString()`). `NO DEFINIDO`: ninguna validación de formato, rango o "fecha futura no permitida" existe en ningún punto del código (ver Parte 13).
- **Auditoría automática**: la función `auditLog(entidad, registroId, accion, antes, despues, entorno)` es el único punto de escritura de la colección `auditoria`; se invoca desde prácticamente cualquier función de escritura del modelo (ver detalle en cada entidad y en la Parte 11).

## 2.1 Índice de entidades (colecciones)

| # | Entidad (nombre lógico) | Colección (`db.collection`) | Subcolecciones |
|---|---|---|---|
| 1 | CuentaBancaria | `cuentas` | — |
| 2 | Categoria / Subcategoria | `categorias` | — (autorreferencial vía `categoria_padre_id`) |
| 3 | Proveedor | `proveedores` | — |
| 4 | Movimiento | `movimientos` | — |
| 5 | Factura | `facturas` | — |
| 6 | FacturaLinea | `factura_lineas` | — |
| 7 | CompromisoFijo | `compromisos` | `importe_historico` |
| 8 | Vencimiento | `vencimientos` | — |
| 9 | SnapshotSaldoBancario | `snapshots` | — |
| 10 | Conciliacion | `conciliaciones` | `detalle` |
| 11 | Transferencia | `transferencias` | — |
| 12 | Documento | `documentos` | — |
| 13 | Auditoria | `auditoria` | — |
| 14 | ConfiguraciónActor | `config/actor` (documento único) | — |
| 15 | ConfiguraciónConciliación | `config/conciliacion` (documento único) | — |

No existen en el artefacto (buscadas expresamente y **no encontradas**, por lo que se marcan `NO DEFINIDO` frente a la lista que pedía el encargo): entidad "Usuario" propiamente dicha (solo el actor de texto libre descrito en 1.2), entidad "Incidencia" como colección (ver Parte 10), entidad "Presupuesto"/"Previsión" persistida (las previsiones son siempre calculadas al vuelo, nunca almacenadas), entidad "Inmovilizado"/"Activo fijo"/"Patrimonio" (no hay ninguna colección ni campo de inmovilizado, amortización contable o patrimonio en todo el artefacto), entidad "Impuesto" como catálogo propio (el impuesto es un campo libre `impuesto_tipo`/`tipo_impuesto`, con una lista `IMPUESTOS_INDIRECTOS_SUGERIDOS` que es solo una sugerencia de interfaz, no una entidad con validación cerrada).

## 2.2 CuentaBancaria (`cuentas`)

**Propósito:** representar una cuenta bancaria o línea de crédito de la farmacia, con un saldo de apertura fijo a partir del cual se calcula siempre el saldo interno (nunca se guarda un saldo "actual").

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `nombre` | string | Sí | libre | — | — |
| `tipo` | string (enum UI) | Sí | `Cuenta corriente` \| `Línea de crédito` \| `Cuenta de inversión` | — | — |
| `activa` | boolean | Sí (fijo al crear) | — | `true` | — |
| `saldo_apertura` | number | Sí | cualquier número | — | — |
| `fecha_saldo_apertura` | string (fecha ISO) | Sí | — | — | — |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Identificador:** `id` autogenerado por el motor de almacenamiento.
**Dependencias entrantes:** `Movimiento.cuenta_id`, `SnapshotSaldoBancario.cuenta_id`, `Transferencia.cuenta_origen_id`/`cuenta_destino_id`.
**Datos derivados (nunca almacenados):** saldo interno en cualquier fecha (`saldoInterno`), diferencia con el banco (`diferenciasPorCuenta`).
**Reglas de integridad:** ninguna validación de unicidad de nombre encontrada (`AMBIGUO — REQUIERE DECISIÓN`: ¿deben rechazarse nombres de cuenta duplicados, igual que en Proveedor?). El campo `activa` se fija en el alta y **no existe ningún control en la interfaz para desactivar una cuenta** después de creada (a diferencia de `CompromisoFijo`, que sí tiene botón Activar/Desactivar) — `NO DEFINIDO`/limitación conocida.
**Auditoría:** se registra `crear` en el alta (`auditLog('Cuenta', ref.id, 'crear', null, data)`). No existe ninguna función de edición ni de auditoría para `modificar` una cuenta ya creada (`NO DEFINIDO`: edición de cuentas).

## 2.3 Categoria / Subcategoria (`categorias`)

**Propósito:** clasificar movimientos y facturas por concepto, en una jerarquía de exactamente 2 niveles (categoría → subcategoría; **no se permite un tercer nivel**, aplicado en la UI: solo pueden elegirse como "padre" categorías que ya son de nivel 1).

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `nombre` | string | Sí | libre | — | — |
| `tipo` | string (enum UI) | Sí | `Ingreso` \| `Gasto` | — | — |
| `categoria_padre_id` | string \| null | No | id de otra `Categoria` de nivel 1 | `null` | Categoria (self) |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Identificador:** `id`. **Nivel 1** = `categoria_padre_id === null`. **Nivel 2 (subcategoría)** = `categoria_padre_id` apunta a una categoría de nivel 1.
**Dependencias entrantes:** `Movimiento.categoria_id`/`subcategoria_id`, `Factura.categoria_id`, `Proveedor.categoria_defecto_id`.
**Reglas de integridad:** la UI impide seleccionar como padre una categoría que ya es subcategoría (filtra las opciones del `<select>`), pero **esta restricción vive solo en la interfaz**, no hay ninguna validación equivalente en una función del motor — `AMBIGUO — REQUIERE DECISIÓN`/riesgo: una escritura directa a la colección podría crear un 3er nivel sin que el motor lo impida.
**Auditoría:** se registra `crear`. No existe función de edición ni de borrado de categorías (`NO DEFINIDO`).

## 2.4 Proveedor (`proveedores`)

**Propósito:** catálogo de proveedores (cooperativas, mayoristas, laboratorios, servicios), con normalización de nombre para evitar duplicados (Regla 8, ver Parte 6).

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `nombre_visible` | string | Sí | libre | — | — |
| `nombre_normalizado` | string | Sí (calculado) | minúsculas, sin diacríticos (`nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')`) | — | — |
| `tipo` | string (enum UI) | Sí | `Cooperativa` \| `Mayorista` \| `Laboratorio` \| `Servicio` | — | — |
| `cif` | string \| null | No | libre | `null` | — |
| `direccion` | string \| null | No | libre | `null` | — |
| `telefono` | string \| null | No | libre | `null` | — |
| `email` | string \| null | No | libre (`type=email` en el formulario, sin validación adicional en el motor) | `null` | — |
| `categoria_defecto_id` | string \| null | No | id de `Categoria` | `null` | Categoria |
| `condiciones_pago` | string \| null | No | libre | `null` | — |
| `activo` | boolean | Sí (fijo al crear) | — | `true` | — |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Identificador:** `id`.
**Dependencias entrantes:** `Movimiento.proveedor_id`, `Factura.proveedor_id`, `Vencimiento` (indirecta, vía `Factura`).
**Datos derivados:** `sugerirCategoriaProveedor(id)` devuelve `categoria_defecto_id` como sugerencia (nunca impuesta) al dar de alta un movimiento.
**Reglas de integridad:** **Regla 8** — unicidad de `nombre_normalizado` validada en el motor de alta (`if((CACHE.proveedores||[]).some(p=>p.nombre_normalizado===norm)){ rechazado }`). Ningún control de unicidad de `cif`. Sin función de edición ni de desactivación desde la interfaz (`activo` se fija en el alta y nunca se cambia después — `NO DEFINIDO`).
**Auditoría:** se registra `crear`.

## 2.5 Movimiento (`movimientos`)

**Propósito:** único registro de tesorería real (ingresos, gastos, financiación, transferencias internas) que afecta al saldo interno de una cuenta.

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `cuenta_id` | string | Sí | id de `CuentaBancaria` | — | CuentaBancaria |
| `fecha` | string (fecha ISO) | Sí | — | — | — |
| `importe` | number | Sí | **siempre positivo** (se guarda `Math.abs(...)`; el signo económico lo determina `tipo`/`subtipo_financiacion`/`direccion`) | — | — |
| `tipo` | string (enum) | Sí | `Ingreso` \| `Gasto` \| `Financiación` \| `Transferencia interna` | — | — |
| `subtipo_financiacion` | string \| null | Condicional (obligatorio si `tipo==='Financiación'`, Regla 1) | `Principal recibido` \| `Principal devuelto` \| `Intereses` \| `Comisiones` | `null` | — |
| `direccion` | string | Solo en `Transferencia interna` | `entrada` \| `salida` | — | — |
| `categoria_id` | string \| null | No | id de `Categoria` (nivel 1) | `null` | Categoria |
| `subcategoria_id` | string \| null | No | id de `Categoria` (nivel 2, hija de `categoria_id`) | `null` | Categoria |
| `proveedor_id` | string \| null | No | id de `Proveedor` | `null` | Proveedor |
| `metodo_cobro_pago` | string \| null | Solo si `tipo` es `Ingreso`/`Gasto` | `TPV` \| `Bizum` \| `Efectivo` \| `Transferencia` | `null` | — (lista fija en código, no colección — confirmado explícitamente en el propio diagnóstico del artefacto) |
| `estado` | string (enum) | Sí | `Previsto` \| `Pendiente` \| `Confirmado` \| `Conciliado` | — (el formulario obliga a elegir entre `Previsto`/`Pendiente`/`Confirmado`; `Conciliado` solo lo asigna el motor) | — |
| `origen` | string (enum) | Sí | `Manual` \| `Importado` \| `Regla` | — | — |
| `relacionado_con_farmacia` | boolean | Sí | — | — | — |
| `clasificacion_origen` | string \| null | No (calculado) | `automatica` \| `manual` \| `null` | `null` si no hay `categoria_id` | — |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Identificador:** `id`.
**Dependencias entrantes:** `Transferencia.movimiento_origen_id`/`movimiento_destino_id`, `Conciliacion/detalle.movimiento_id`.
**Datos derivados (nunca almacenados):** signo económico (`signoMovimiento`), importe disponible sin aplicar en conciliaciones (`importeDisponibleMovimiento`).
**Reglas de integridad:** Regla 1 (`Financiación` exige `subtipo_financiacion`, validado en el `onsubmit` del formulario, **no** en una función del motor reutilizable — `AMBIGUO`: no hay una función central `crearMovimientoValidado()` análoga a `crearVencimientoValidado()`; toda la validación de Movimiento vive únicamente en el `onsubmit` de la pantalla). El campo `estado` transiciona a `Conciliado` únicamente desde `registrarConciliacion()` (motor), nunca por edición manual en la interfaz (no existe pantalla de edición de movimientos, salvo el ejemplo interno de la suite de pruebas, `actualizarMovimiento`, que es solo de uso interno del test harness).
**Auditoría:** se registra `crear` en el alta.

## 2.6 Factura (`facturas`)

**Propósito:** documento de compra/gasto recibido de un proveedor; entidad central del sistema, con el modelo más extenso de todo el artefacto (construido en fases sucesivas, "ETAPA D").

**Campos heredados ("legacy", anteriores a ETAPA D — se conservan siempre, nunca se borran ni se sobrescriben con datos inventados):**

| Campo | Tipo | Uso actual |
|---|---|---|
| `estado` | string | Histórico: `Recibida` \| `Posible duplicado` \| `Duplicado confirmado`. Se sigue escribiendo en el alta y en la resolución de duplicados (ver Parte 15, hallazgo de duplicación con `estado_documental`/`estado_duplicado`) |
| `base_imponible` | null | **Sin uso real.** Se escribe siempre `null` en el alta. Dato fiscal real vive en `desglose_fiscal` |
| `iva` | null | **Sin uso real**, igual que el anterior — campo específico de IVA, sustituido por el modelo fiscal genérico |
| `documento_original` | null | **Sin uso real** — sustituido por la entidad `Documento` (Etapa C) |
| `resuelto_por` | string \| undefined | Actor que resolvió un posible duplicado |
| `fecha_resolucion` | string (ISO datetime) \| undefined | Fecha de esa resolución |

**Campos del modelo extendido (ETAPA D · Bloque 1 y siguientes):**

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `proveedor_id` | string | Sí | id de `Proveedor` | — | Proveedor |
| `fecha` | string (fecha ISO) | Sí | — | — | — |
| `fecha_emision` | string (fecha ISO) | Sí (duplica `fecha` en el alta actual) | — | = `fecha` | — |
| `fecha_recepcion` | string \| null | No | — | `null` | — |
| `fecha_vencimiento` | string \| null | No | — | `null` | — (**no** es el vencimiento real de pago; ese vive en la colección `Vencimiento`. Este campo de cabecera **no se usa en ningún cálculo** del motor — `AMBIGUO`: propósito exacto sin uso funcional confirmado) |
| `fecha_contabilizacion` | string (ISO datetime) \| null | No (calculado) | — | se fija al pasar `estado_contable` a `Contabilizada` | — |
| `numero_factura` | string \| null | No | libre | `null` | — |
| `total` | number | Sí | **cualquier número, incluido negativo** (una `Factura` de tipo `Abono` puede tener `total` negativo) | — | — |
| `estado_documental` | string (enum) | Sí (con valor por defecto) | `Recibida` \| `En revisión` \| `Validada` \| `Incidencia` \| `Anulada` | `Recibida` | — |
| `estado_duplicado` | string (enum) | Sí (con valor por defecto) | `No detectado` \| `Posible duplicado` \| `Duplicado confirmado` \| `Falso positivo` | `No detectado` | — |
| `estado_contable` | string (enum) | Sí (con valor por defecto) | `Pendiente` \| `Contabilizada` \| `Revisada` | `Pendiente` | — |
| `naturaleza` | string \| null | No | `Compra de mercancía` \| `Gasto fijo` \| `Gasto variable` \| `Servicio` \| `Impuesto` \| `Nómina` \| `Financiación` \| `Otro` | `null` | — |
| `categoria_id` | string \| null | No | id de `Categoria` | `null` | Categoria |
| `moneda` | string | Sí | libre (única usada en la práctica: `EUR`) | `EUR` | — |
| `forma_pago` | string \| null | No | libre (usada en la práctica: `Adeudos SEPA`, ver Parte 14 datos de importación real) | `null` | — |
| `condiciones_pago` | string \| null | No | libre | `null` | — |
| `observaciones` | string \| null | No | libre | `null` | — |
| `usuario_crea` | string | Sí | — | `currentActor()` | — |
| `usuario_valida` | string \| null | No (calculado) | — | se fija al pasar `estado_documental` a `Validada` | — |
| `tipo_factura` | string (enum) | Sí | `Normal` \| `Rectificativa` \| `Abono` | `Normal` | — |
| `factura_relacionada_id` | string \| null | Condicional (obligatorio si `tipo_factura≠Normal`; prohibido si `=Normal`) | id de otra `Factura` | `null` | Factura (self, **inmutable tras la creación**) |
| `desglose_fiscal` | array de objetos | No | ver estructura abajo | `[]` | — |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Estructura de cada elemento de `desglose_fiscal` (array embebido, no es una subcolección):**

| Subcampo | Tipo |
|---|---|
| `impuesto_tipo` | string (sugerido: `IGIC` \| `IVA` \| `Exento` \| `No sujeto` \| `No registrado`; **no es una lista cerrada** en el motor) |
| `impuesto_nombre` | string |
| `tipo_impositivo` | number \| null (porcentaje) |
| `base_imponible` | number \| null |
| `cuota_impuesto` | number \| null |
| `regimen_fiscal` | string \| null (**nunca se rellena en ningún punto del código actual** — `NO DEFINIDO`: su significado y su uso previsto) |

**Campo calculado, NUNCA persistido (regla explícita y deliberada del propio código):** `estado_pago`. No existe como campo en la base de datos bajo ningún nombre. Se calcula siempre en el momento (ver Parte 5).

**Identificador:** `id`.
**Dependencias entrantes:** `FacturaLinea.factura_id`, `Vencimiento.factura_id`, `Documento.factura_id`, `Factura.factura_relacionada_id` (auto-referencia de otra factura hija).
**Datos derivados:** estado de duplicado derivado de campos legacy si no existe `estado_duplicado` propio (`derivarEstadoDuplicadoLegacy`), resumen fiscal (`resumenFiscalFactura`), todas las magnitudes de pago (Parte 5), familia documental y posición neta (Parte 3).
**Reglas de integridad:** Regla 9 (una factura en `Posible duplicado`/`Duplicado confirmado` nunca puede generar un `Vencimiento`, aplicada en `crearVencimientoValidado`), inmutabilidad de `tipo_factura`/`factura_relacionada_id` tras la creación (no existe ninguna función de edición de esos dos campos), protección contra referencias circulares y auto-referencia en `validarNuevaRelacionFactura`.
**Auditoría:** se registra `crear` en el alta; `cambiar_estado_documental`, `cambiar_estado_contable`, `migrar_etapa_d`, `crear_rectificativa`/`crear_abono`, `documento_relacionado_creado`, `documento_asociado`, `documento_sustituido`, `resolver_duplicado_confirmado`, `resolver_no_duplicado`, `reordenar_lineas_factura` — todas con `entidad:'Factura'`.

## 2.7 FacturaLinea (`factura_lineas`)

**Propósito:** desglose opcional, línea a línea, del contenido de una factura. Una factura puede no tener ninguna línea, una, o varias; cuando existen, son la fuente de verdad del desglose fiscal detallado (la cabecera sigue siendo el resumen documental y nunca se sobrescribe automáticamente a partir de las líneas).

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto | Relación |
|---|---|---|---|---|---|
| `factura_id` | string | Sí | id de `Factura` | — | Factura |
| `orden` | number | Sí (calculado si no se indica) | entero ≥ 1 | siguiente disponible | — |
| `descripcion` | string \| null | No | libre | `null` | — |
| `codigo_producto` | string \| null | No | libre | `null` | — |
| `referencia_proveedor` | string \| null | No | libre | `null` | — |
| `cantidad` | number \| null | No | — | `null` | — |
| `precio_unitario` | number \| null | No | — | `null` | — |
| `descuento_tipo` | string \| null | No | `Porcentual` \| `Absoluto` | `null` | — |
| `descuento_valor` | number \| null | No | — | `null` | — |
| `tipo_impuesto` | string \| null | No | igual criterio que `Factura.desglose_fiscal.impuesto_tipo` (no cerrado) | `null` | — |
| `nombre_impuesto` | string \| null | No (calculado) | — | `= tipo_impuesto` si no se indica | — |
| `tipo_impositivo` | number \| null | No | porcentaje | `null` | — |
| `base_imponible` | number \| null | No (calculado o del documento) | — | derivado por fórmula o tal cual del documento | — |
| `cuota_impuesto` | number \| null | No (calculado o del documento) | — | ídem | — |
| `total` | number \| null | No (calculado o del documento) | — | ídem | — |
| `origen_importes` | string (enum, calculado) | Sí | `formula` \| `documento` | según si se aportaron importes directos al crear | — |
| `observaciones` | string \| null | No | libre | `null` | — |
| `estado_linea` | string (enum) | Sí | `Activa` \| `Eliminada` (baja lógica, nunca se borra físicamente) | `Activa` | — |
| `created_at` / `updated_at` | string (ISO datetime) | Sí | — | momento de la operación | — |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` | — |

**Identificador:** `id`. **Clave lógica de agrupación:** `factura_id` + `orden`.
**Fórmula estándar (cuando la línea no trae importes ya fijados por el documento):** `bruto = cantidad × precio_unitario`; `descuento = (Porcentual: bruto×valor/100) | (Absoluto: valor)`; `base = bruto − descuento`; `cuota = base × tipo_impositivo/100`; `total = base + cuota` (ver fórmula F-22 en la Parte 4).
**Reglas de integridad:** si al crear la línea se aporta `base_imponible`/`cuota_impuesto`/`total` directamente, esos valores se respetan tal cual (`origen_importes:'documento'`) y **no** se recalculan con la fórmula. Al editar, si se toca un campo "de fórmula" (`cantidad`,`precio_unitario`,`descuento_tipo`,`descuento_valor`,`tipo_impositivo`), los importes se recalculan íntegramente desde cero (nunca se arrastra un valor caducado); si se toca un importe directamente, se respeta tal cual; si no se toca ni lo uno ni lo otro (p. ej. solo la descripción), los importes existentes no se alteran.
**Auditoría:** `crear_linea_factura`, `modificar_linea_factura`, `eliminar_logico_linea_factura` (entidad `FacturaLinea`); `reordenar_lineas_factura` se audita sobre la entidad `Factura`, no sobre cada línea.

## 2.8 CompromisoFijo (`compromisos`) + subcolección `importe_historico`

**Propósito:** representar una obligación o ingreso recurrente (alquiler, préstamo, impuesto, nómina, servicio) a partir del cual se generan series de `Vencimiento` previstos.

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto |
|---|---|---|---|---|
| `concepto` | string | Sí | libre | — |
| `tipo` | string (enum) | Sí | `Financiación` \| `Impuesto` \| `Nómina` \| `Servicio recurrente` | — |
| `naturaleza` | string (enum) | Sí | `Pago` \| `Cobro` | — |
| `importe_estimado` | number | Sí | — | — |
| `periodicidad` | string (enum) | Sí | `Mensual` \| `Trimestral` \| `Semestral` \| `Anual` (mapa a meses: 1/3/6/12) | — |
| `fecha_inicio` | string (fecha ISO) | Sí | — | — |
| `activo` | boolean | Sí | — | `true` |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` |

**Subcolección `compromisos/{id}/importe_historico`:**

| Campo | Tipo |
|---|---|
| `importe` | number |
| `vigente_desde` | string (fecha ISO) |

**Identificador:** `id`. **Dato derivado clave:** `importeVigente(compromisoId, fechaISO)` — recorre el histórico ordenado descendentemente y devuelve el primer `importe` cuyo `vigente_desde <= fechaISO`; si no hay histórico aplicable, usa `importe_estimado`.
**Regla 13 (actualización de importe nunca reescribe histórico):** `actualizarImporteCompromiso()` **añade** una entrada nueva al histórico (nunca modifica ni borra una existente) y solo actualiza el `importe` de los `Vencimiento` **futuros y no consolidados** (`estado` en `Previsto`/`Pendiente`, `fecha >= vigenteDesde`); los vencimientos ya pagados/pasados quedan intactos.
**Auditoría:** `crear`, `actualizar_importe`, `generar_vencimientos`, `activar`/`desactivar`.

## 2.9 Vencimiento (`vencimientos`)

**Propósito:** obligación de cobro o pago con fecha e importe concretos; puede proceder de una `Factura` o de un `CompromisoFijo`, nunca de ambos ni de ninguno (Regla 10).

| Campo | Tipo | Obligatorio | Valores permitidos | Por defecto |
|---|---|---|---|---|
| `factura_id` | string \| null | Condicional | id de `Factura` | `null` |
| `compromiso_fijo_id` | string \| null | Condicional | id de `CompromisoFijo` | `null` |
| `fecha` | string (fecha ISO) | Sí | — | — |
| `importe` | number | Sí | **estrictamente > 0** (validado en `crearVencimientoValidado`) | — |
| `estado` | string (enum) | Sí | `Previsto` \| `Pendiente` \| `Pagado` | `Previsto` (generado por compromiso) o `Pendiente` (alta manual) |
| `tipo` | string (enum) | Sí | `Proveedor` \| `Impuesto` \| `Nómina` \| `Financiación` \| `Otro` | — |
| `tipo_vencimiento` | string (enum) | Sí | `Pago` \| `Cobro` | `Pago` |
| `entorno` | string | Sí | `produccion` \| `prueba` | `produccion` |

**Identificador:** `id`. **Regla de exclusividad (Regla 10):** exactamente uno de `factura_id`/`compromiso_fijo_id` debe estar presente; el motor rechaza tanto "ninguno" como "ambos".
**Única vía de escritura válida (tras el saneamiento del Bloque 4):** `crearVencimientoValidado()`, que es la que usan tanto la pantalla de alta manual como `crearVencimientoFactura()` (envoltorio usado por la Ficha) como, indirectamente, la generación en serie desde `CompromisoFijo` (`generarVencimientos()`, que no pasa por `crearVencimientoValidado` sino que escribe directamente — ver hallazgo en Parte 15).
**Dato derivado clave:** `estadoVencimientoCalculado(v)` compara el importe conciliado real contra `TOLERANCIA_REDONDEO_EUR` y determina si el vencimiento debería estar `Pagado`; se usa para detectar coherencia (`detalleVencimiento().coherente`), pero **el campo `estado` solo se actualiza automáticamente a `Pagado`** dentro de `registrarConciliacion()`, nunca se revierte automáticamente si después se retira una conciliación (no existe ninguna función para retirar/anular una conciliación — `NO DEFINIDO`).
**Auditoría:** `crear_vencimiento_factura` / `crear_vencimiento_compromiso`, `marcar_pagado`.

## 2.10 SnapshotSaldoBancario (`snapshots`)

**Propósito:** registrar el saldo que el banco comunica en una fecha concreta, para poder calcular la diferencia frente al saldo interno calculado por el sistema.

| Campo | Tipo | Obligatorio | Valores permitidos |
|---|---|---|---|
| `cuenta_id` | string | Sí | id de `CuentaBancaria` |
| `fecha` | string (fecha ISO) | Sí | — |
| `saldo_comunicado_banco` | number | Sí | — |
| `origen` | string (enum) | Sí | `Manual` \| `Importado` |
| `entorno` | string | Sí | `produccion` \| `prueba` |

**Identificador:** `id`. **Nota:** el alta de snapshot **no llama a `auditLog`** (único caso detectado de una escritura de entidad sin auditoría explícita propia — ver hallazgo en Parte 15).

## 2.11 Conciliacion (`conciliaciones`) + subcolección `detalle`

**Propósito:** vincular un `Vencimiento` con uno o varios `Movimiento` (y viceversa: relación N:N real), registrando cuánto importe de cada movimiento se aplica a cada vencimiento.

| Campo (documento `Conciliacion`) | Tipo | Obligatorio | Valores permitidos |
|---|---|---|---|
| `tipo` | string (enum) | Sí | `Exacta` \| `Parcial` \| `Agrupada` |
| `nivel_confianza` | number \| null | No | 0–100 |
| `confirmado_por` | string \| null | Condicional (Regla 7: obligatorio si `tipo≠Exacta`) | libre |
| `fecha_confirmacion` | string (ISO datetime) \| null | No (calculado) | — |
| `exceso_autorizado` | boolean | Sí | — |
| `motivo_exceso` | string \| null | Condicional (obligatorio si hay exceso autorizado) | libre |
| `autorizado_por` | string \| null | No (calculado) | = actor, si hay exceso |
| `entorno` | string | Sí | `produccion` \| `prueba` |

**Subcolección `conciliaciones/{id}/detalle` (uno o más registros por conciliación — en la práctica actual, `registrarConciliacion()` siempre crea exactamente 1 registro de detalle por llamada; el modelo admite más de uno pero el código no lo usa así — `SUPUESTO` de diseño para uso futuro, no confirmado como comportamiento actual):**

| Subcampo | Tipo |
|---|---|
| `vencimiento_id` | string → Vencimiento |
| `movimiento_id` | string → Movimiento |
| `importe_aplicado` | number (> 0) |

**Identificador:** `id` del documento `Conciliacion`; el `detalle` no tiene identificador de negocio propio más allá del autogenerado.
**Única vía de escritura:** `registrarConciliacion()` (ver Parte 5 para su comportamiento completo). No existe ninguna función para editar o borrar una conciliación ya registrada (`NO DEFINIDO`: corrección de errores de conciliación).
**Auditoría:** `conciliar` (sobre `Conciliacion`), `sobre_conciliacion_autorizada` (si hubo exceso, sobre `Conciliacion`), `marcar_pagado` (sobre `Vencimiento`, condicional), `conciliar` (sobre `Movimiento`, condicional, cuando el movimiento queda totalmente aplicado).

## 2.12 Transferencia (`transferencias`)

**Propósito:** representar el movimiento de fondos entre dos cuentas propias, garantizando que siempre nace como un par de `Movimiento` (salida + entrada) perfectamente emparejado.

| Campo | Tipo |
|---|---|
| `movimiento_origen_id` | string → Movimiento (dirección `salida`) |
| `movimiento_destino_id` | string → Movimiento (dirección `entrada`) |
| `cuenta_origen_id` | string → CuentaBancaria |
| `cuenta_destino_id` | string → CuentaBancaria |
| `entorno` | string |

**Identificador:** `id`. **Única vía de creación:** `crearTransferencia()`, que valida `cuentaOrigen !== cuentaDestino` y crea siempre los 2 movimientos + el registro de `Transferencia` en una única operación conceptual (3 escrituras). **Nota:** `crearTransferencia()` **no llama a `auditLog`** (ni sobre los 2 movimientos ni sobre la propia transferencia) — segundo caso detectado de escritura de negocio sin auditoría (ver Parte 15).

## 2.13 Documento (`documentos`)

**Propósito:** índice/metadato del archivo original (PDF o imagen) de una factura, cuyo contenido físico vive en el almacenamiento de `assets` (nunca se sobrescribe: un documento nuevo siempre sustituye, nunca reemplaza el archivo físico del anterior).

| Campo | Tipo | Obligatorio | Valores permitidos |
|---|---|---|---|
| `factura_id` | string | Sí | id de `Factura` |
| `nombre_original` | string | Sí | nombre de archivo tal cual lo subió el usuario |
| `tipo_mime` | string (enum) | Sí | `application/pdf` \| `image/jpeg` \| `image/png` \| `image/webp` |
| `tamano_bytes` | number | Sí | `> 0` y `≤ 10.485.760` (10 MB, límite de aplicación; el límite real de la plataforma para estos tipos es 20 MB según el propio comentario del código) |
| `hash_sha256` | string | Sí | huella criptográfica del contenido del archivo |
| `fecha_incorporacion` | string (ISO datetime) | Sí | — |
| `actor` | string | Sí | — |
| `referencia_almacenamiento` | string | Sí | id del asset en `assets` |
| `estado_documento` | string (enum) | Sí | `Activo` \| `Sustituido` (**nunca** `Eliminado`) |
| `created_at` / `updated_at` | string (ISO datetime) | Sí | — |
| `entorno` | string | Sí | `produccion` \| `prueba` |

**Identificador:** `id`. **Regla de unicidad de una factura activa:** solo puede existir **como mucho un** documento con `estado_documento==='Activo'` por `factura_id` en un momento dado (garantizado porque `subirDocumentoFactura()` sustituye siempre el activo previo).
**Deduplicación por hash:** si el hash SHA-256 de un archivo subido ya existe en otro documento (de cualquier factura), se detecta como `duplicado_detectado` y no se sube una copia física nueva salvo confirmación explícita del usuario (`forzarDuplicado:true`), en cuyo caso el nuevo documento reutiliza la misma `referencia_almacenamiento` que el existente.
**Auditoría:** `subir_documento`, `sustituir_documento`, `documento_sustituido` (sobre `Factura`), `documento_asociado` (sobre `Factura`), `detectar_documento_duplicado`, `duplicado_confirmado_reutilizado`.

## 2.14 Auditoria (`auditoria`)

**Propósito:** registro histórico de acciones, único mecanismo de trazabilidad del sistema. Ver desarrollo completo en la Parte 11.

| Campo | Tipo |
|---|---|
| `entidad` | string (nombre lógico de la entidad afectada, p. ej. `Factura`, `FacturaLinea`, `Vencimiento`, `Conciliacion`, `Movimiento`, `Cuenta`, `Categoria`, `Proveedor`, `CompromisoFijo`, `Documento`, `Sistema`) |
| `registro_id` | string (id del documento afectado, o un identificador sintético para acciones de sistema, p. ej. `'limpieza-'+Date.now()`) |
| `actor` | string (= `currentActor()` en el momento de la acción) |
| `fecha` | string (ISO datetime) |
| `accion` | string (nombre de la acción; ver catálogo completo en la Parte 11) |
| `valores_antes` | objeto \| null |
| `valores_despues` | objeto \| null |
| `entorno` | string |

**Identificador:** `id`. **Regla de integridad implícita:** es **append-only** desde la interfaz de usuario (la pantalla "Auditoría" es explícitamente de solo lectura); solo se borra mediante `ejecutarLimpiezaHuerfanos()` cuando el propio registro de auditoría pertenece a datos de prueba/huérfanos, nunca cuando es de producción.

## 2.15 Documentos de configuración

**`config/actor`** — documento único (no colección): `{ nombre: string }`. Editado desde el campo de la cabecera.
**`config/conciliacion`** — documento único: `{ diasAlta:number, confianzaAlta:number, diasMedia:number, confianzaMedia:number, confianzaBaja:number }`. Valor por defecto si el documento no existe (`DEFAULT_CONFIG_CONCILIACION`): `{ diasAlta:5, diasMedia:15, confianzaAlta:95, confianzaMedia:60, confianzaBaja:40 }`. Editado desde la pantalla "Conciliación".


---

# PARTE 3 — FACTURAS: CICLO DE VIDA COMPLETO

## 3.0 Visión general del ciclo

El artefacto modela el ciclo de una factura como la combinación de **cuatro estados independientes**, nunca fusionados en uno solo, más un quinto "estado" que **nunca se guarda**:

| Estado | Campo | Se guarda | Cambia mediante |
|---|---|---|---|
| Documental | `estado_documental` | Sí | `cambiarEstadoDocumentalFactura()` únicamente |
| Duplicado | `estado_duplicado` | Sí (o derivado del legado) | Ver 3.4 — `CONTRADICCIÓN DETECTADA` |
| Contable | `estado_contable` | Sí | `cambiarEstadoContableFactura()` únicamente |
| Pago (documento) | *(no existe campo)* | **No** | Calculado por `estadoPagoFactura()` |
| Pago (familia) | *(no existe campo)* | **No** | Calculado por `estadoPagoFamiliaFactura()` |

Cita literal del comentario de cabecera del Bloque 1 (justifica el diseño): *"Al no existir un sitio donde guardarlo, es estructuralmente imposible que quede 'Pagada' en pantalla con vencimientos de verdad pendientes."*

El flujo que describe la mecánica del código, expresado como diagrama de estados (CALCULADO a partir del código, no es un campo único en el artefacto):

```
[Factura creada]  (estado_documental='Recibida' por defecto)
        │
        ├─► estado_duplicado: 'No detectado' | 'Posible duplicado' | 'Duplicado confirmado' | 'Falso positivo'
        │       └─ mientras sea 'Posible duplicado' o 'Duplicado confirmado' → NO puede generar
        │          vencimientos (Regla 9, aplicada en facturasElegiblesParaVencimiento() y en
        │          crearVencimientoValidado()).
        │
        ├─► estado_documental: 'Recibida' → 'En revisión' → 'Validada' | 'Incidencia' | 'Anulada'
        │       (lista cerrada ESTADOS_DOCUMENTALES_FACTURA; cambiarEstadoDocumentalFactura()
        │        SOLO valida pertenencia a la lista, no exige una secuencia — ver 3.9 AMBIGUO)
        │
        ├─► estado_contable: 'Pendiente' → 'Contabilizada' → 'Revisada'
        │       (lista cerrada ESTADOS_CONTABLES_FACTURA; misma limitación de transición libre)
        │
        └─► (si estado_duplicado NO bloquea) → Vencimiento(s) creado(s) vía crearVencimientoValidado()
                └─► Conciliación(es) vía registrarConciliacion()
                        └─► estadoPagoFactura() / estadoPagoFamiliaFactura() = 'Pendiente' |
                            'Parcialmente pagada' | 'Pagada' | 'Pagada con saldo a favor' (solo familia) |
                            'Sin vencimiento registrado' (solo familia) | 'Anulada' (si estado_documental='Anulada')
```

## 3.1 Creación de una factura

**Función:** no existe una función de creación de factura nombrada y centralizada equivalente a `crearVencimientoValidado()` — la creación de una `Factura` de tipo `Normal` se realiza mediante escritura directa `db.collection('facturas').add(...)` desde la pantalla (`buildSection('facturas')`). **AMBIGUO — REQUIERE DECISIÓN**: a diferencia de Vencimiento (que recibió el "SANEAMIENTO B4"), la creación de facturas Normales no pasa por una función de validación centralizada; solo la creación de documentos relacionados (Rectificativa/Abono) sí la tiene (`crearDocumentoRelacionadoFactura()`, ver 3.6).

Valores por defecto al crear (según el patrón de migración `parcheMigracionEtapaD`, que es la referencia documentada de qué campos "nuevos" existen): `estado_documental:'Recibida'`, `estado_duplicado:'No detectado'`, `estado_contable:'Pendiente'`, `moneda:'EUR'`, `tipo_factura:'Normal'`, `factura_relacionada_id:null`, `desglose_fiscal:[]`.

## 3.2 Detección de duplicados

**NO DEFINIDO** en el material extraído de este documento: la función que *detecta* automáticamente un posible duplicado (p. ej. por `numero_factura` + `proveedor_id` coincidentes) no fue localizada entre las funciones "motor" catalogadas en la Parte 4; el comportamiento observado son los **valores posibles** del campo (`ESTADOS_DUPLICADO_FACTURA = ['No detectado','Posible duplicado','Duplicado confirmado','Falso positivo']`) y su efecto aguas abajo (bloqueo de vencimientos). Si existe una función detectora en el archivo fuera de los tramos citados en este documento, debe localizarse y documentarse antes de que Lovable modifique este área; en su ausencia, Lovable **no debe asumir** que existe un algoritmo de detección automática más allá de lo aquí confirmado.

## 3.3 Resolución de duplicados — CONTRADICCIÓN DETECTADA

El comentario de cabecera del Bloque 1 (línea ~21 del bloque, citado en la Parte 2) enumera `resolver_duplicado` como la función nombrada y auditada equivalente a `cambiarEstadoDocumentalFactura`/`cambiarEstadoContableFactura` para cambiar `estado_duplicado`. **Ninguna función con ese nombre (ni ningún nombre equivalente único) existe en el código fuente inspeccionado.** Lo que existe, confirmado por lectura directa (`buildSection('facturas')`, controladores `data-dupok`/`data-dupno`), son dos bloques de código **inline** dentro de los manejadores de clic de los botones "Confirmar duplicado" y "No es duplicado":

```js
// botón "Confirmar duplicado" (data-dupok):
const despues = {estado:'Duplicado confirmado', estado_duplicado:'Duplicado confirmado', resuelto_por:currentActor(), fecha_resolucion:new Date().toISOString()};
await db.collection('facturas').doc(fac.id).update(despues);
await auditLog('Factura', fac.id, 'resolver_duplicado_confirmado', antes, despues);

// botón "No es duplicado" (data-dupno):
const despues = {estado:'Recibida', estado_duplicado:'Falso positivo', resuelto_por:currentActor(), fecha_resolucion:new Date().toISOString()};
await db.collection('facturas').doc(fac.id).update(despues);
await auditLog('Factura', fac.id, 'resolver_no_duplicado', antes, despues);
```

**Matiz importante:** ambos bloques sí llaman a `auditLog()` con `valores_antes`/`valores_despues` correctos (acciones `resolver_duplicado_confirmado` y `resolver_no_duplicado`, confirmadas también dentro de `runTests()`, líneas ~3380 y ~3387/3572) — la auditoría **no falta**. Lo que falta, a diferencia de `cambiarEstadoDocumentalFactura()`/`cambiarEstadoContableFactura()`, es: (a) una función reutilizable con nombre propio que pueda llamarse desde otro punto de la interfaz o desde una prueba sin duplicar el bloque de código; (b) cualquier validación de que el estado actual permite esa transición (p. ej. nada impide llamar a "Confirmar duplicado" sobre una factura que ya está en `'Duplicado confirmado'` o en `'No detectado'`).

**Consecuencia para Lovable:** el cambio de `estado_duplicado` es, hoy, el único de los tres estados guardados de Factura que **no** tiene una función centralizada equivalente. Si se decide corregir esta inconsistencia, debe crearse una función `resolverDuplicadoFactura()` (o el nombre que se decida) siguiendo exactamente el mismo patrón que `cambiarEstadoDocumentalFactura()` — **DECISIÓN DE DISEÑO pendiente de que Alfonso la autorice explícitamente** (ver Parte 17, regla de no modificar sin autorización).

## 3.4 Estado documental — transiciones

Lista cerrada: `ESTADOS_DOCUMENTALES_FACTURA = ['Recibida','En revisión','Validada','Incidencia','Anulada']`.

`cambiarEstadoDocumentalFactura(facturaId, nuevoEstado, ctx, track)`:
- Valida solo que `nuevoEstado` pertenezca a la lista cerrada (`throw` si no).
- Si `nuevoEstado==='Validada'`, fija automáticamente `usuario_valida = currentActor()`.
- Escribe, actualiza el `ctx` en memoria y llama a `auditLog('Factura', facturaId, 'cambiar_estado_documental', antes, cambios, entorno)`.
- **AMBIGUO — REQUIERE DECISIÓN:** no existe una matriz de transiciones permitidas (p. ej. no se impide pasar de `'Anulada'` de vuelta a `'Recibida'`, ni saltar directamente de `'Recibida'` a `'Validada'` sin pasar por `'En revisión'`). Cualquier transición entre los 5 valores es técnicamente aceptada por esta función. Si Alfonso desea restringir el grafo de transiciones, es una decisión de negocio nueva, no una que el código actual ya tome.

## 3.5 Estado contable — transiciones

Lista cerrada: `ESTADOS_CONTABLES_FACTURA = ['Pendiente','Contabilizada','Revisada']`.

`cambiarEstadoContableFactura()` sigue el mismo patrón: valida pertenencia a la lista, y **si y solo si** `nuevoEstado==='Contabilizada'` fija `fecha_contabilizacion = new Date().toISOString()` (si ya existía una fecha de contabilización previa, se conserva: `f.fecha_contabilizacion || null`). Misma limitación **AMBIGUO** que 3.4: no hay grafo de transiciones restringido.

## 3.6 Documentos relacionados: Rectificativas y Abonos

**Funciones:** `crearRectificativaFactura(facturaRelacionadaId, datos, ctx, track)` y `crearAbonoFactura(...)` — ambas envoltorios directos de `crearDocumentoRelacionadoFactura(tipoFactura, facturaRelacionadaId, datos, ctx, track)`.

Reglas de negocio aplicadas (extraídas literalmente de los comentarios de diseño del Bloque 3, ver Parte 2 y Parte 6 para el catálogo formal):

1. El `total` se guarda **tal cual aparece en el documento real** — nunca se fuerza a negativo ni se reinterpreta; representa el AJUSTE ("método por diferencias"), no un importe restablecido. El "método por sustitución" (donde el total reexpresa la factura corregida completa) queda **explícitamente fuera de alcance**.
2. `factura_relacionada_id` apunta siempre al **padre inmediato**, no siempre a la factura original — para hallar la original hay que subir la cadena con `facturaOriginalDe()`.
3. Varias rectificativas/abonos pueden compartir el mismo padre (no se limita a una relación 1:1).
4. La relación es **inmutable tras la creación**: no existe ninguna función para cambiar `tipo_factura`/`factura_relacionada_id` de una factura ya creada.
5. Protección anti-ciclo: `validarNuevaRelacionFactura()` recorre la cadena ascendente del padre propuesto con un `Set` de visitados y un límite de profundidad de 200; lanza error `'Referencia circular detectada...'` o `'...demasiado profunda o corrupta.'` si se excede. `facturaOriginalDe()` y `documentosRelacionadosDeFactura()` tienen la misma protección defensiva por si un dato legado ya trae un ciclo (devuelven `cicloDetectado:true` en vez de colgarse).
6. `validarNuevaRelacionFactura()`: si `tipoFactura==='Normal'` exige que NO haya `facturaRelacionadaId`; si es `'Rectificativa'`/`'Abono'` la exige obligatoriamente, y la factura padre debe existir.
7. Alcance declarado explícitamente como límite conocido: una rectificativa que corrige **varias** facturas originales a la vez (relación N:M) **no está soportada** — se documenta como "límite conocido, revisable si se vuelve necesidad operativa real".

**Auditoría:** `crearDocumentoRelacionadoFactura()` escribe dos entradas de auditoría por creación: una sobre el documento nuevo (`accion:'crear_rectificativa'` o `'crear_abono'`) y otra sobre la factura padre (`accion:'documento_relacionado_creado'`).

**Importante — vencimientos NO se tocan:** crear una rectificativa/abono **nunca** modifica los vencimientos de la factura original ya existentes. El efecto económico se expresa aparte (`pendienteNetoFamiliaFactura()`, `posicionPagoFactura()` — ver Parte 5), nunca reescribiendo un vencimiento ya conciliado.

## 3.7 Líneas de factura (`factura_lineas`)

**Función de lectura:** `lineasDeFactura(facturaId, ctx, incluirEliminadas=false)` — por defecto excluye las líneas en estado `'Eliminada'` (baja lógica, nunca física).

**Creación:** `crearLineaFactura(facturaId, datos, ctx, track)`. El `orden` se autoasigna (`max(orden existente)+1`) si no se especifica. `origen_importes` se fija a `'documento'` si `datos` ya trae `base_imponible`/`cuota_impuesto`/`total`, o `'formula'` si esos importes se derivan de `calcularLineaFactura()`.

**Fórmula de línea (`calcularLineaFactura`)** — se aplica **solo donde faltan datos**; si la línea ya trae un importe fijado por el documento, ese valor se respeta tal cual y nunca se le superpone la fórmula:

```
importe_bruto     = (cantidad != null && precio_unitario != null) ? round(cantidad * precio_unitario, 2) : null
descuento_importe = descuento_tipo==='Porcentual' ? round(importe_bruto * descuento_valor) / 100
                   : descuento_tipo==='Absoluto'   ? descuento_valor
                   : 0
base_imponible    = (dato ya fijado en la línea) ?? (importe_bruto != null ? round(importe_bruto - descuento_importe, 2) : null)
cuota_impuesto    = (dato ya fijado en la línea) ?? (base_imponible != null && tipo_impositivo != null ? round(base_imponible * tipo_impositivo) / 100 : null)
total             = (dato ya fijado en la línea) ?? (base_imponible != null ? round(base_imponible + (cuota_impuesto||0), 2) : null)
```

**Edición (`actualizarLineaFactura`)** — tres ramas mutuamente excluyentes, decididas por qué campos toca el cambio:
1. Si el cambio toca `base_imponible`/`cuota_impuesto`/`total` directamente → esos valores se respetan tal cual (como si vinieran del documento), `origen_importes` pasa a `'documento'` (salvo que el propio cambio especifique otro valor).
2. Si el cambio toca un campo de entrada de fórmula (`CAMPOS_FORMULA_LINEA = ['cantidad','precio_unitario','descuento_tipo','descuento_valor','tipo_impositivo']`) sin tocar los importes directamente → se **recalcula desde cero** (nunca se arrastra un valor caducado), `origen_importes:'formula'`.
3. Si no toca ni fórmula ni importes (p. ej. solo `descripcion`/`observaciones`) → los importes existentes se **conservan intactos**.

**Recalcular explícito:** `recalcularImportesLineaFactura()` fuerza un recálculo íntegro descartando cualquier importe manual previo (llama a `recalcularLineaFactura()`, que invoca `calcularLineaFactura()` con `base_imponible/cuota_impuesto/total` puestos a `null`).

**Reordenar:** `reordenarLineasFactura(facturaId, ordenIds, ctx, track)` — reasigna `orden` secuencialmente (1, 2, 3…) según el array de ids recibido; registra una única entrada de auditoría con el orden antes/después completo.

**Eliminación:** `eliminarLogicamenteLineaFactura(lineaId, ctx, track)` — baja lógica únicamente (`estado_linea:'Eliminada'`); la línea nunca se borra físicamente de `factura_lineas` (trazabilidad).

**Coherencia líneas↔cabecera:** `compararTotalesLineasCabecera(facturaId, ctx)` — **nunca corrige nada**, solo expone la diferencia. Si la factura no tiene líneas, devuelve `{tieneLineas:false}`. La comparación de `baseTotal` con la cabecera solo se realiza si la cabecera tiene fiscalidad registrada (`resumenFiscalFactura(f).estado==='Registrado'`); si no, no es una incoherencia — es, simplemente, un dato que la cabecera no fijó. Usa `dentroDeTolerancia()` (±`TOLERANCIA_REDONDEO_EUR` = 0.01 €) para decidir `coherenteBase`/`coherenteTotal`.

**Desglose fiscal desde líneas:** `resumenFiscalLineasFactura(facturaId, ctx)` — agrega por `tipo_impuesto` a partir de las líneas; es la fuente de verdad del desglose **detallado** cuando existen líneas (declarado explícitamente en el comentario de diseño del Bloque 2, punto C — ver Parte 16, Fuentes de verdad).

## 3.8 Documento original (archivo adjunto) de una factura

**Función central:** `subirDocumentoFactura(facturaId, file, opts, ctx, track, trackAsset)`.

Validaciones, en este orden exacto:
1. `assets` debe estar disponible (`throw` si no: *"El almacenamiento de documentos (assets) no está disponible en esta vista."*).
2. Tipo de archivo debe estar en `TIPOS_DOC_PERMITIDOS[file.type]` (**NO DEFINIDO** en el material extraído: el contenido exacto de `TIPOS_DOC_PERMITIDOS` no se transcribió en este documento; el mensaje de error indica *"Solo se aceptan PDF, JPG, PNG o WEBP."*).
3. `file.size > 0`, si no `throw` *"El archivo está vacío."*
4. `file.size <= MAX_DOC_BYTES` (mensaje indica un límite de **10 MB** por documento).

El hash SHA-256 del archivo (`sha256Hex`, vía `crypto.subtle.digest`) determina el resultado:

| Condición | `resultado` devuelto |
|---|---|
| Ya existe un documento con ese hash, asociado a **esta misma** factura, y está `'Activo'` | `'sin_cambios'` |
| Ya existe un documento con ese hash en **otra** factura (o en la misma pero no activo) y `!opts.forzarDuplicado` | `'duplicado_detectado'` (además audita `'detectar_documento_duplicado'`, no sube nada) |
| No existe duplicado, o `opts.forzarDuplicado=true` y ya había un documento activo previo en esta factura | `'sustituido'` (el documento anterior pasa a `estado_documento:'Sustituido'`, nunca se borra) |
| No existe duplicado, o `forzarDuplicado=true`, y **no** había documento activo previo | `'asociado'` |

Si `forzarDuplicado=true` y el hash ya existía, el archivo físico **no se vuelve a subir** (`reutilizaArchivo=true`): se reutiliza la misma `referencia_almacenamiento`. Cada rama relevante genera su propia entrada de auditoría (`subir_documento`, `sustituir_documento`, `documento_sustituido`, `documento_asociado`, `duplicado_confirmado_reutilizado`, `detectar_documento_duplicado`).

**Salud documental global:** `saludDocumental(ctx)` — cuenta facturas con/sin documento activo, documentos activos/sustituidos, y detecta duplicados documentales (mismo hash asociado a más de una factura distinta) sin corregir nada, solo informa (`posiblesDuplicadosDocumentales`).

## 3.9 Vencimientos y pagos de la factura

Ver desarrollo íntegro en la **Parte 5** (siete funciones centrales) — no se repite aquí para evitar una segunda fuente de verdad sobre la misma lógica (principio de la Parte 16).

## 3.10 Compromisos fijos vinculados

Un `Vencimiento` nace de una `Factura` **o** de un `CompromisoFijo`, nunca de ambos ni de ninguno (Regla 10, aplicada por `crearVencimientoValidado()`). La generación automática en serie desde un `CompromisoFijo` es responsabilidad de `generarVencimientos()` (Motor 3, Parte 4) — **no pasa por `crearVencimientoValidado()`**, ver hallazgo 🟠 en la Parte 15.

## 3.11 Incidencias sobre una factura

Ver Parte 10 — **el sistema no tiene una entidad Incidencia**; `'Incidencia'` es únicamente uno de los cinco valores posibles de `estado_documental`.

## 3.12 Historial y trazabilidad de una factura

Todo cambio relevante sobre una `Factura` (creación, cambio de estado documental/contable, creación de documento relacionado, documento subido/sustituido, línea creada/editada/reordenada/eliminada, vencimiento creado, conciliación registrada) genera una entrada en `auditoria` vía la función única `auditLog()`. Ver catálogo completo de acciones en la Parte 11.

## 3.13 Eliminación / anulación de una factura

**NO DEFINIDO:** no se localizó ninguna función de borrado físico de `Factura` en el material inspeccionado (coherente con el principio "no destructivo" del proyecto). La única vía de "cierre" observada es el estado documental `'Anulada'`, que es un valor más de `ESTADOS_DOCUMENTALES_FACTURA` sin lógica especial adicional más allá de: (a) `estadoPagoFactura()` devuelve directamente `'Anulada'` sin mirar los importes conciliados; (b) `estadoPagoFamiliaFactura()` hace lo mismo consultando el estado documental de la factura **original** de la familia. No se ha localizado ninguna restricción que impida anular una factura con vencimientos ya conciliados, ni ninguna reversión automática de esos vencimientos al anular — **AMBIGUO — REQUIERE DECISIÓN** si se desea añadir esa validación.

---

# PARTE 4 — CATÁLOGO DE FÓRMULAS

Convención de cada entrada: **ID · NOMBRE · UBICACIÓN · OBJETIVO · ENTRADAS · FÓRMULA EXACTA · SALIDA · UNIDAD · REDONDEO · CASOS LÍMITE · ESTADO**. ESTADO usa: 🟢 CORRECTO (matemáticamente consistente y sin contradicción detectada) / 🟠 POSIBLE ERROR / 🔴 ERROR / ⚪ NO VERIFICABLE (falta ejecutar contra datos reales). Ninguna fórmula de esta parte ha sido ejecutada en este proceso — el ESTADO se basa únicamente en lectura de código, no en resultados reales.

### F-01 · `saldoInterno(cuentaId, fechaISO, ctx)`
UBICACIÓN: Motor 1. OBJETIVO: saldo de una cuenta bancaria en una fecha, según los movimientos ya confirmados. ENTRADAS: `cuenta.saldo_apertura`, `movimientos` con `cuenta_id` igual y `estado ∈ {Confirmado, Conciliado}`, con `fecha` entre `cuenta.fecha_saldo_apertura` y `fechaISO` (ambos incluidos).
FÓRMULA: `total = saldo_apertura + Σ |importe| × signo(m)`, donde `signo()` (F-00, `signoMovimiento`) = `+1` si `tipo='Ingreso'`; `−1` si `tipo='Gasto'`; `±1` según `direccion` si `tipo='Transferencia interna'`; `+1`/`−1` según `subtipo_financiacion==='Principal recibido'` si `tipo='Financiación'`; `0` en cualquier otro caso.
SALIDA: número (€) o `null` si la cuenta no existe. REDONDEO: ninguno explícito en esta función (se acumula en punto flotante; el redondeo ocurre en los consumidores, p. ej. `diferenciasPorCuenta`). CASOS LÍMITE: movimientos con `tipo` no reconocido por `signoMovimiento()` cuentan como `0` (ni suman ni restan) — no producen error. ESTADO: ⚪.

### F-02 · `saldoConsolidado(fechaISO, ctx)`
UBICACIÓN: Motor 1. OBJETIVO: suma del saldo de todas las cuentas. FÓRMULA: `Σ saldoInterno(c.id, fechaISO, ctx)` para cada cuenta, tratando `null` como `0`. SALIDA: € REDONDEO: ninguno explícito. ESTADO: ⚪.

### F-03 · `diferenciasPorCuenta(ctx)`
UBICACIÓN: Motor 2. OBJETIVO: comparar el saldo interno calculado con el saldo comunicado por el banco en cada snapshot, y clasificar la gravedad de la diferencia por **evidencia temporal real**, nunca por número de snapshots ni por tiempo transcurrido desde el último hasta hoy (cita literal del comentario). FÓRMULA: para cada snapshot, `diferencia = round(saldo_comunicado_banco − saldoInterno(cuenta, snapshot.fecha), 2)`. Si el último snapshot tiene `diferencia===0` → estado `'Cuadrada'`. Si no, se retrocede desde el último snapshot mientras la diferencia anterior también sea distinta de 0, para hallar `inicioEvidencia` (el primer snapshot de la racha de descuadre); `diasConfirmados = último.fecha − inicioEvidencia.fecha` (días); estado = `'Requiere revisión'` si `diasConfirmados > 7`, si no `'Informativa'`. Si no hay ningún snapshot → `'Sin snapshot'`. SALIDA: objeto por cuenta con `{cuenta, ultimo, diferencia, estado, diasConfirmados, diasSinConfirmar}`. ESTADO: 🟢 (la lógica de "evidencia real" está documentada y coincide con el código).

### F-04 · `importeVigente(compromisoId, fechaISO, ctx)`
UBICACIÓN: Motor 3. OBJETIVO: importe aplicable de un compromiso fijo en una fecha dada, respetando el histórico de cambios de importe. FÓRMULA: de `historico` (subcolección `importe_historico`, ordenada por `vigente_desde` descendente), toma el primer registro con `vigente_desde <= fechaISO`; si ninguno cumple, usa `compromiso.importe_estimado`. SALIDA: € ESTADO: 🟢.

### F-05 · `generarVencimientos(compromiso, ocurrencias=12, ctx, track)`
UBICACIÓN: Motor 3. OBJETIVO: generar la serie de vencimientos previstos de un compromiso fijo. LÓGICA: parte de la última fecha ya generada (o `compromiso.fecha_inicio` si no hay ninguna), y avanza `ocurrencias` veces con `siguienteFecha(fecha, periodicidad)` = `addMonths(fecha, PERIOD_MONTHS[periodicidad])`; cada vencimiento nuevo usa `importeVigente()` (F-04) para el importe, `estado:'Previsto'`. Escribe directamente en `db.collection('vencimientos')`. **Nota de auditoría (ver Parte 15):** esta función escribe directamente y NO pasa por `crearVencimientoValidado()` (Parte 5) — no reutiliza sus validaciones (Regla 9/10). ESTADO: 🟠 (funciona correctamente para su propósito, pero es una segunda vía de escritura de `Vencimiento` no unificada con la vía "manual").

### F-06 · `actualizarImporteCompromiso(compromisoId, nuevoImporte, vigenteDesde, ctx)`
UBICACIÓN: Motor 3. OBJETIVO: cambiar el importe futuro de un compromiso sin reescribir el histórico. LÓGICA: añade un registro a `importe_historico`; actualiza el `importe` de todos los vencimientos **futuros y no cerrados** del compromiso (`estado ∈ {Previsto, Pendiente}` y `fecha >= vigenteDesde`) al nuevo valor — los vencimientos ya `'Pagado'` o anteriores a `vigenteDesde` no se tocan. SALIDA: nº de vencimientos afectados. ESTADO: 🟢.

### F-07 · `movimientosFiltrados(filtros, ctx)`
UBICACIÓN: Motor 4/5. OBJETIVO: única fuente de filtrado de movimientos reutilizada por cash flow, informes y comparativa. Solo incluye movimientos con `estado ∈ {Confirmado, Conciliado}`; aplica filtros opcionales `tipos`, `desde`, `hasta`, `cuentaId`, `categoriaId`, `proveedorId`, `metodo`, `relacionado` (true/false/'todos'). ESTADO: 🟢.

### F-08 · `cashFlowOperativo(desde, hasta, agruparPor, ctx)`
UBICACIÓN: Motor 4. OBJETIVO: cash flow de explotación en un rango, excluyendo movimientos no relacionados con la farmacia. ENTRADAS: usa `movimientosOperativosEnRango()` = `movimientosFiltrados({desde,hasta,tipos:['Ingreso','Gasto'],relacionado:true})`. FÓRMULA: `ingresos = Σ|importe|` de tipo Ingreso; `gastos = Σ|importe|` de tipo Gasto; `neto = ingresos − gastos`. Desglose opcional por `categoria`/`proveedor`/`metodo`/`cuenta`. SALIDA: € REDONDEO: ninguno explícito (acumulación directa). ESTADO: ⚪.

### F-09 · `gastoFinanciero(desde, hasta, ctx)`
UBICACIÓN: Motor 5. OBJETIVO: separar intereses de comisiones dentro de movimientos de tipo `Financiación`. FÓRMULA: filtra `tipo==='Financiación' ∧ subtipo_financiacion ∈ {Intereses, Comisiones} ∧ estado ∈ {Confirmado,Conciliado} ∧ fecha ∈ [desde,hasta]`; suma `|importe|` por subtipo. **Nota conceptual clave del proyecto (Sección 5 de las instrucciones del proyecto):** esta función es la separación explícita, en el modelo de datos y en el cálculo, entre el principal de deuda (no aparece aquí) y los intereses/comisiones (sí aparecen aquí) — confirma que el sistema respeta la distinción exigida por FARMATRACK entre devolución de principal y gasto financiero real. ESTADO: 🟢.

### F-10 · `vencimientoYaConciliado(vencimientoId, ctx)`
UBICACIÓN: Motor 6 (y reutilizada en toda la Parte 5). OBJETIVO: importe ya conciliado contra un vencimiento concreto. FÓRMULA: `Σ |importe_aplicado|` de todos los `detalle` de conciliación (`ctx.conciliacionDetalle`) cuyo `vencimiento_id` coincide. SALIDA: € sin redondeo explícito en esta función (se redondea en los consumidores vía `redondearEuros`). ESTADO: 🟢 (es la única función que lee `conciliacionDetalle` para este propósito — fuente de verdad única, ver Parte 16).

### F-11 · `previsionTesoreria(dias, ctx)`
UBICACIÓN: Motor 6. OBJETIVO: previsión de tesorería a N días (30/60/90). FÓRMULA: `saldoActual = saldoConsolidado(hoy)`; `abiertosEnRango` = vencimientos `estado ∈ {Previsto,Pendiente}` con `fecha ∈ [hoy, hoy+dias]` — **límite inclusivo en `hoy`, deliberado** (cita literal del comentario: *"un vencimiento con fecha de hoy sigue sin cobrarse/pagarse y debe contar... excluirlo por ser 'hoy' era un error de límite (off-by-one)"* — corrección histórica documentada en el propio código); `pagosPrevistos = Σ max(0, importe − vencimientoYaConciliado)` sobre los de `tipo_vencimiento==='Pago'`; `cobrosPrevistos` análogo para `'Cobro'`; `previsto = saldoActual + cobrosPrevistos − pagosPrevistos`. ESTADO: 🟢.

### F-12 · `crearTransferencia({cuentaOrigen,cuentaDestino,fecha,importe,estado}, ctx, track)`
UBICACIÓN: Motor 7. OBJETIVO: mover fondos entre dos cuentas propias como par de movimientos emparejados (salida + entrada), nunca como ingreso/gasto operativo. VALIDACIÓN: `cuentaOrigen !== cuentaDestino` (si no, `throw`). Crea dos `Movimiento` (`tipo:'Transferencia interna'`, `direccion:'salida'`/`'entrada'`, mismo `importe` absoluto) y un registro en `transferencias` que los empareja. **Hallazgo (ver Parte 15):** esta función **no llama a `auditLog()`** — a diferencia de prácticamente cualquier otra escritura del sistema, una transferencia no deja entrada en `auditoria`. 🟠.

### F-13 · `sugerirConciliaciones(ctx)`
UBICACIÓN: Motor 8. OBJETIVO: sugerir emparejamientos movimiento↔vencimiento, **nunca aplicar nada automáticamente** — solo ordena y explica. Los umbrales (`diasAlta`, `confianzaAlta`, `diasMedia`, `confianzaMedia`, `confianzaBaja`, de `config/conciliacion`) son editables por el usuario y **no son una regla financiera fija del sistema** (cita literal del comentario). ESTADO: ⚪ (algoritmo de puntuación completo no transcrito íntegramente en este documento — se confirma su naturaleza de sugerencia no vinculante; el resto del cuerpo de la función debe consultarse en el código fuente si Lovable necesita replicarla exactamente).

### F-14 · `sugerirCategoriaProveedor(proveedorId, ctx)`
UBICACIÓN: (entre Motor 8 y 9). OBJETIVO: sugerir la categoría por defecto de un proveedor. FÓRMULA: devuelve `proveedor.categoria_defecto_id` o `null`. ESTADO: 🟢 (trivial).

### F-15 · `facturasElegiblesParaVencimiento(ctx)`
UBICACIÓN: Motor 10 — "Regla 9 completa" (cita literal del comentario de cabecera). OBJETIVO: excluir del alta de vencimientos cualquier factura en estado de duplicado no resuelto. FÓRMULA: `facturas.filter(f => estadoDuplicadoFactura(f) ∉ {'Posible duplicado','Duplicado confirmado'})`. ESTADO: 🟢 — y ver F-30 (`crearVencimientoValidado`) donde la misma regla se re-valida en la escritura, no solo en el listado.

### F-16 · `resumenFiscalFactura(f)`
UBICACIÓN: Bloque 1. OBJETIVO: agregar el desglose fiscal de CABECERA (`desglose_fiscal`). FÓRMULA: si `desglose_fiscal` está vacío → `{estado:'No registrado', tipos:[], baseTotal:0, cuotaTotal:0}` (**nunca** se infiere un IGIC/IVA implícito de 0€ — es explícitamente "no registrado", distinto de "registrado con importe 0"); si no, `baseTotal = round(Σ base_imponible, 2)`, `cuotaTotal = round(Σ cuota_impuesto, 2)`, `tipos` = valores únicos de `impuesto_tipo`. ESTADO: 🟢.

### F-17 · `importePendienteFactura(facturaId, ctx)` (nivel DOCUMENTO, Bloque 1)
UBICACIÓN: Bloque 1. OBJETIVO: pendiente de pago a nivel del documento individual (no de familia). FÓRMULA: `max(0, round(f.total − totalConciliadoFactura(facturaId), 2))`, donde `totalConciliadoFactura = Σ vencimientoYaConciliado(v.id)` sobre los vencimientos **directos** de esa factura (`vencimientosDeFactura`, filtro simple por `factura_id`, sin recorrer la familia documental). **Ver F-31 para el equivalente a nivel FAMILIA — son dos cálculos independientes, no unificados** (hallazgo central de la Parte 15). ESTADO: 🟠 (correcto matemáticamente, pero duplicado conceptual con F-31).

### F-18 · `estadoPagoFactura(facturaId, ctx)` (nivel DOCUMENTO)
UBICACIÓN: Bloque 1. FÓRMULA: si `estadoDocumentalFactura(f)==='Anulada'` → `'Anulada'`. Si no: `pagado = totalConciliadoFactura(facturaId)`; si `pagado <= TOLERANCIA_REDONDEO_EUR` → `'Pendiente'`; si `pagado >= f.total − TOLERANCIA_REDONDEO_EUR` → `'Pagada'`; si no → `'Parcialmente pagada'`. **Nunca se persiste** — confirmado: no existe el campo `estado_pago` en ningún documento `Factura` de `db`. ESTADO: 🟠 — ver F-32 (equivalente de familia) y hallazgo de duplicación en Parte 15.

### F-19 · `calcularLineaFactura(l)`, F-20 `calcularDescuentoImporteLinea`, F-21 `calcularTotalesLineasFactura`, F-22 `compararTotalesLineasCabecera`, F-23 `resumenFiscalLineasFactura`
Ver desarrollo íntegro con fórmula exacta en la **Parte 3.7**. Todas ESTADO: 🟢, salvo la ausencia de tolerancia propia (usan `dentroDeTolerancia`, F-24).

### F-24 · `dentroDeTolerancia(a,b)`
UBICACIÓN: Bloque 2. `Math.abs(a−b) <= TOLERANCIA_REDONDEO_EUR + 1e-9` (el `+1e-9` es guarda de precisión de punto flotante). `TOLERANCIA_REDONDEO_EUR = 0.01` (1 céntimo) — constante centralizada única para **toda** comparación monetaria del sistema (cita literal: "Ninguna otra función hardcodea su propio margen"). ESTADO: 🟢.

### F-25 · `posicionNetaFactura(facturaId, ctx)`
UBICACIÓN: Bloque 3 — Regla 3. FÓRMULA: `round(Σ total, 2)` de la factura original + todos sus documentos relacionados (a cualquier profundidad de la cadena), cada `total` con su propio signo, tal cual está en el documento. ESTADO: 🟢.

### F-26 · `pendienteNetoFamiliaFactura(facturaId, ctx)`
UBICACIÓN: Bloque 3 — Regla 8/9, solo análisis (el motor de pagos formal no cambia en este bloque). FÓRMULA: `round(posicionNetaFactura(facturaId) − totalConciliadoFactura(original.id), 2)`. Puede ser **negativo** (saldo a favor) — se muestra tal cual, nunca se fuerza a 0. ESTADO: 🟢 — nota: esta función coexiste con `posicionPagoFactura()` (Bloque 4, F-31), que es la versión "oficial" con las 6 magnitudes separadas; `pendienteNetoFamiliaFactura` es la versión preliminar de análisis del Bloque 3. **AMBIGUO — REQUIERE DECISIÓN:** ¿sigue en uso `pendienteNetoFamiliaFactura` en alguna pantalla, o quedó reemplazada por `posicionPagoFactura`? No confirmado en el material extraído para este documento.

### F-27 · `redondearEuros(n)`
`Math.round((n||0)*100)/100`. Es **redondeo de presentación/acumulación**, explícitamente distinto de una tolerancia (cita literal del comentario en el propio código: *"redondeo de presentación/acumulación, NO es una tolerancia"*). ESTADO: 🟢.

### F-28 · `movimientoYaAplicado(movimientoId, ctx)` y F-29 `importeDisponibleMovimiento(movimientoId, ctx)`
UBICACIÓN: Bloque 4. `movimientoYaAplicado = redondearEuros(Σ|importe_aplicado|)` de todos los detalles de conciliación de ese movimiento (protección de doble conteo — un mismo movimiento no puede aplicarse dos veces por más de lo que vale). `importeDisponibleMovimiento = redondearEuros(|m.importe| − movimientoYaAplicado)`. ESTADO: 🟢.

### F-30 · `estadoVencimientoCalculado(v, ctx)` y `detalleVencimiento(vencimientoId, ctx)`
Ver Parte 5.3 — desarrollo completo (una de las 7 funciones nombradas por Alfonso).

### F-31 · `posicionPagoFactura(facturaId, ctx)` (nivel FAMILIA — función central del Bloque 4)
Ver Parte 5.1 — desarrollo completo (fórmula central del sistema de pagos).

### F-32 · `estadoPagoFamiliaFactura(facturaId, ctx)`
Ver Parte 5.2.

### F-33 · `validarConciliacion(...)` y F-34 `registrarConciliacion(...)`
Ver Parte 5.4 y 5.5.

### F-35 · `resumenPagosGlobal(ctx)`
UBICACIÓN: fin del Bloque 4 — "agregado global para el dashboard, una sola fuente para todas las cifras" (cita literal). FÓRMULA: itera sobre todas las facturas que **no son documento relacionado** (`!esDocumentoRelacionado(f)`, es decir solo originales), clasifica cada una por `estadoPagoFamiliaFactura()` y acumula `deudaPendiente`/`saldoAFavor` de `posicionPagoFactura()`; cuenta como `incoherencias` las facturas con `excesoAjusteNoRespaldado > TOLERANCIA_REDONDEO_EUR`; añade `vencimientosProximos` = vencimientos abiertos con `fecha <= hoy+30`. SALIDA: objeto agregado con 12 campos (ver Parte 8, KPIs de Dashboard). ESTADO: 🟢 — es la fuente de verdad para el Dashboard en materia de pagos (ver Parte 16), y usa la versión de FAMILIA (`estadoPagoFamiliaFactura`), no la de documento — dato relevante para resolver la ambigüedad de la Parte 15.

### F-36 · `variacion(a,b)` y `compararPeriodos(rangoA, rangoB, agruparPor, ctx)`
UBICACIÓN: Motor 11. FÓRMULA de variación: `abs = b−a`; `pct = a!==0 ? (abs/|a|)*100 : (b!==0 ? 100 : 0)` (evita división por cero; si el periodo base es 0 y el nuevo no, la variación se informa como +100%, nunca `Infinity` ni `NaN`). `compararPeriodos` reutiliza literalmente `cashFlowOperativo()` y `gastoFinanciero()` dos veces (una por rango) — "no hay ninguna fórmula nueva aquí" (cita literal). ESTADO: 🟢.

### F-37 · `informeVencimientos(ctx)` y F-38 `agruparImporte(movs, dimension, ctx)`
UBICACIÓN: cierre de los motores. Funciones de agregación/informe reutilizando los datos ya calculados por los motores anteriores; no introducen fórmulas financieras nuevas más allá de agrupar y sumar. ESTADO: ⚪ (cuerpo completo no transcrito íntegramente en este documento).

### F-39 · `saludDocumental(ctx)`
Ver Parte 3.8. ESTADO: 🟢.

### F-40 · `sha256Hex(data)`, `crc32(bytes)` y funciones del `ZipBuilder`
UBICACIÓN: infraestructura de backup/documentos, no son fórmulas financieras. `sha256Hex` usa `crypto.subtle.digest('SHA-256', ...)` nativo del navegador (no reimplementado). El escritor/lector ZIP (`ZipBuilder`, `leerZip`, `ZIP_CRC_TABLE`, `crc32`) es una reimplementación mínima sin dependencias externas del formato ZIP en método STORE (sin comprimir), justificada explícitamente porque un artefacto publicado no puede cargar librerías externas vía CDN. No forman parte del "modelo financiero" y se documentan aquí solo por completitud del catálogo de funciones puras. ESTADO: 🟢 (uso correcto de la API nativa para SHA-256; el ZIP se autoverifica con un lector independiente en `runTests()`).

**Nota de cobertura:** este catálogo cubre las funciones "motor" identificadas explícitamente con comentarios `MOTOR N` más las funciones puras centrales de ETAPA C/D. Funciones de renderizado (`buildSection`) y utilidades de formato (`fmt`, `opt`, `fillSelect`, `todayISO`, `addDays`, `addMonths`, `siguienteFecha`) no se catalogan como "fórmulas" porque no calculan magnitudes financieras nuevas, solo presentan o transforman fechas de calendario.

---

# PARTE 5 — LÓGICA DE PAGOS: LAS 7 FUNCIONES NOMBRADAS POR EL USUARIO

**Confirmación explícita solicitada por Alfonso:** las siete funciones citadas en la misión — `posicionPagoFactura()`, `estadoPagoFamiliaFactura()`, `detalleVencimiento()`, `familiaDocumentalFactura()`, `lineasDeFactura()`, `documentosDeFactura()`, `crearVencimientoValidado()` — **existen todas en el código fuente, exactamente con esos nombres**. Confirmado por lectura directa del archivo fuente completo (4628 líneas). Ubicaciones: `familiaDocumentalFactura` y `lineasDeFactura` en Bloques 3/2 respectivamente (ver Parte 3.6/3.7); `documentosDeFactura` en ETAPA C (ver Parte 3.8); `posicionPagoFactura`, `estadoPagoFamiliaFactura`, `detalleVencimiento`, `crearVencimientoValidado` en el Bloque 4, desarrolladas a continuación con su código íntegro.

## 5.1 · `posicionPagoFactura(facturaId, ctx)` — función central del sistema de pagos

Cita literal del comentario que la precede: *"FUNCIÓN CENTRAL del bloque: devuelve todas las magnitudes por separado, sin mezclarlas. Ninguna pantalla recalcula nada por su cuenta — todas leen de aquí."*

**Las seis magnitudes, sin mezclar nunca (definición literal del comentario de diseño):**

| Símbolo | Nombre | Significado |
|---|---|---|
| T | `totalDocumental` | importe documental de la factura ORIGINAL (lo que dice el documento) |
| A | `ajusteTotal` | ajustes posteriores (rectificativas/abonos), documental, con su signo |
| O | `obligacionAbierta` | Σ importes de los vencimientos de la familia |
| P | `pagado` | Σ importes conciliados sobre esos vencimientos |
| D | `deudaPendiente` | lo que REALMENTE queda por pagar (siempre ≥ 0) |
| S | `saldoAFavor` | crédito generado por un ajuste ya pagado (siempre ≥ 0) |

D y S son **dos magnitudes distintas**, nunca "un pendiente negativo" — decisión de diseño explícita.

**Fórmula exacta:**
```
A'  (ajusteNoFormalizado) = Σ (total_del_ajuste − Σ importes_de_SUS_propios_vencimientos)
                             — si una rectificativa al alza ya tiene su propio vencimiento,
                               su efecto ya está contado en O y no se repite aquí (nunca doble conteo)
netoPendiente  = O − P + A'
D = max(0, netoPendiente)
saldoBruto     = max(0, −netoPendiente)
S = min(saldoBruto, P)                    ← un crédito nunca puede superar lo efectivamente pagado
excesoAjusteNoRespaldado = saldoBruto − S ← si > 0: INCOHERENCIA de datos, se expone, nunca se absorbe

Si deudaPendiente <= TOLERANCIA_REDONDEO_EUR → deudaPendiente = 0
Si saldoAFavor    <= TOLERANCIA_REDONDEO_EUR → saldoAFavor = 0
```

Si la familia no tiene ningún vencimiento (`sinVencimientos=true`): `netoPendiente`, `deudaPendiente`, `saldoAFavor` quedan **todos en `null`** (nunca se inventa un pago ni se convierte un abono sin vencimiento en saldo a favor ficticio — decisión de diseño explícita, punto 11 del comentario del bloque).

**Objeto devuelto, campo a campo:** `facturaOriginalId`, `totalDocumental` (T), `ajusteTotal` (A), `ajusteNoFormalizado` (A'), `posicionDocumentalNeta` (= T+A), `obligacionAbierta` (O), `pagado` (P), `netoPendiente` (uso interno, con signo), `deudaPendiente` (D), `saldoAFavor` (S), `excesoAjusteNoRespaldado`, `sinVencimientos`, `numVencimientos`, `numAjustes`, `diferenciaObligacionVsDocumento` (= O − T). Devuelve `null` si no hay factura original o se detecta un ciclo en la cadena documental.

Regla económica citada literalmente: *"un ajuste posterior se aplica PRIMERO contra la deuda pendiente; solo el exceso, y solo hasta donde haya pagos reales que lo respalden, se convierte en saldo a favor."*

## 5.2 · `estadoPagoFamiliaFactura(facturaId, ctx)`

Deriva **siempre** de `posicionPagoFactura()` — nunca se persiste, no existe un campo `estado_pago` en `db`.

```
p = posicionPagoFactura(facturaId, ctx)
si p es null                                          → null
si estado_documental(original) === 'Anulada'           → 'Anulada'
si p.sinVencimientos                                   → 'Sin vencimiento registrado'
si p.saldoAFavor > 0                                   → 'Pagada con saldo a favor'
si p.deudaPendiente <= TOLERANCIA_REDONDEO_EUR          → 'Pagada'
si p.pagado <= TOLERANCIA_REDONDEO_EUR                  → 'Pendiente'
en cualquier otro caso                                  → 'Parcialmente pagada'
```

Admite un **quinto y sexto estado** (`'Pagada con saldo a favor'`, `'Sin vencimiento registrado'`) que no caben en los tres estados del documento individual (`estadoPagoFactura`, F-18) — decisión de diseño explícita (punto 10 del comentario de bloque): *"no se fuerza ese concepto dentro de los tres estados anteriores."*

## 5.3 · `detalleVencimiento(vencimientoId, ctx)`

Depende de `estadoVencimientoCalculado(v, ctx)`:
```
conciliado = vencimientoYaConciliado(v.id, ctx)
si conciliado <= TOLERANCIA_REDONDEO_EUR   → (v.estado==='Previsto' ? 'Previsto' : 'Pendiente')
si conciliado >= v.importe - TOLERANCIA_REDONDEO_EUR → 'Pagado'
en cualquier otro caso                      → 'Pendiente'
```
`detalleVencimiento()` devuelve la ficha completa de un vencimiento en una sola llamada (cita literal: *"fecha, importe original, conciliado, pendiente, estado y relación con la factura"*): `{id, fecha, factura_id, compromiso_fijo_id, tipo, tipo_vencimiento, importeOriginal, importeConciliado, importePendiente, estadoAlmacenado, estadoCalculado, coherente}`. El campo `coherente` compara el `estado` **guardado** en `db` con el **calculado** aquí — permite detectar (y mostrar) cualquier desincronización entre ambos, sin corregirla automáticamente.

## 5.4 · `validarConciliacion({vencimientoId, movimientoId, importeAplicado}, ctx)`

Comprobación previa, **sin escribir nada** — reutilizable por la interfaz para avisar antes de guardar. Errores de entrada: vencimiento no encontrado, movimiento no encontrado, o `importeAplicado <= 0` (*"no hay ningún caso modelado que admita importes negativos o cero"*). Si pasa esas validaciones: `pendienteVencimiento = redondearEuros(v.importe − vencimientoYaConciliado)`; `disponibleMovimiento = importeDisponibleMovimiento(movimientoId)`; `excedeVencimiento = importeAplicado > pendienteVencimiento + TOLERANCIA_REDONDEO_EUR`; `excedeMovimiento` análogo. `ok = !excedeVencimiento && !excedeMovimiento`.

## 5.5 · `registrarConciliacion(...)` — única vía de escritura

Cita literal: *"ÚNICA vía de escritura de una conciliación — la interfaz y la suite de pruebas pasan las dos por aquí, así que ninguna validación puede saltarse desde una pantalla."*

Secuencia de validación (en este orden, cada una puede abortar con `throw`):
1. Reutiliza `validarConciliacion()` — si hay errores de entrada, aborta.
2. Si `tipo !== 'Exacta'` (es decir `'Parcial'` o `'Agrupada'`) y no se indica `confirmadoPor` → `throw` **"Rechazado (Regla 7): una conciliación Parcial o Agrupada exige confirmado_por."**
3. Si hay exceso (sobre el vencimiento o sobre el movimiento) y `!autorizarExceso` → `throw` con el detalle exacto de cuánto excede cada lado.
4. Si hay exceso y no se indica `motivoExceso` → `throw` **"Una sobre-conciliación autorizada exige un motivo explícito: sin motivo no se registra."**

Efectos, tras pasar la validación:
- Crea `Conciliacion` (`tipo`, `nivel_confianza`, `confirmado_por`, `fecha_confirmacion`, `exceso_autorizado`, `motivo_exceso`, `autorizado_por`).
- Crea `detalle` (subcolección) con `{vencimiento_id, movimiento_id, importe_aplicado}`.
- Audita `'conciliar'` siempre, y adicionalmente `'sobre_conciliacion_autorizada'` si hubo exceso.
- Actualiza `Vencimiento.estado` a `'Pagado'` **solo si** `estadoVencimientoCalculado()` ya lo dice tras la conciliación y aún no lo tenía guardado — audita `'marcar_pagado'`.
- Actualiza `Movimiento.estado` a `'Conciliado'` **solo cuando queda totalmente aplicado** (`importeDisponibleMovimiento <= TOLERANCIA_REDONDEO_EUR`) — audita `'conciliar'` sobre el Movimiento. Mientras le quede importe sin aplicar, el movimiento sigue disponible, y así puede saldar varios vencimientos distintos.

## 5.6 · `crearVencimientoValidado(datos, ctx, track)` — única vía de alta manual de vencimiento

Cita literal: *"ÚNICA vía de escritura para dar de alta un vencimiento a mano... No cambia ninguna regla económica ni la matemática de posicionPagoFactura: solo impide que entre un dato inválido por una pantalla que antes escribía directamente en el almacenamiento."*

Validaciones, en este orden:
1. `Regla 10`: exactamente uno de `factura_id` / `compromiso_fijo_id` debe estar presente (ni ambos ni ninguno).
2. `importe` debe ser un número finito y **estrictamente mayor que cero** (un abono se representa como documento relacionado — Bloque 3 — nunca como vencimiento negativo).
3. `fecha` es obligatoria.
4. Si nace de una factura: la factura debe existir, y `Regla 9`: si `estadoDuplicadoFactura(f) ∈ {'Posible duplicado','Duplicado confirmado'}` → `throw`.
5. Si nace de un compromiso: el compromiso debe existir.

Escribe el `Vencimiento`, audita (`crear_vencimiento_factura` o `crear_vencimiento_compromiso`). **Nota explícita del propio comentario:** la generación automática en serie desde un `CompromisoFijo` (`generarVencimientos()`, F-05) **sigue su propio camino ya existente** y no pasa por esta función — confirmado como hallazgo en Parte 15 (🟠, no es un error de esta función sino una cobertura incompleta del saneamiento).

`crearVencimientoFactura(facturaId, datos, ctx, track)` es un envoltorio directo que fija `factura_id` y `compromiso_fijo_id:null` y delega en `crearVencimientoValidado()`.

## 5.7 Resumen de la cadena de fuente de verdad del pago

Cita literal (comentario de Bloque 1): *"FACTURA -> VENCIMIENTOS -> CONCILIACIONES -> MOVIMIENTOS"*. Ninguna magnitud de pago se calcula saltándose un eslabón de esta cadena; todas las funciones de esta Parte 5 recorren siempre `Vencimiento → conciliacionDetalle → Movimiento`, nunca leen o infieren un estado de pago directamente del propio documento `Factura`.

---

# PARTE 6 — REGLAS DE NEGOCIO (RB-XXX)

**Nota metodológica importante:** el código usa **dos numeraciones de reglas NO unificadas y NO equivalentes**, confirmado por búsqueda exhaustiva en el archivo completo:
1. Citas explícitas `"Regla N"` en comentarios y mensajes de error — solo aparecen los números **1, 3, 4, 5, 6, 7, 8, 9, 10, 13** (nunca 2, 11, 12, ni ningún número > 13 como cita "Regla N").
2. Enumeraciones "punto N" dentro de los comentarios de cabecera de cada bloque de ETAPA D — **cada bloque reinicia su propia numeración en 1** (p. ej. "punto 16" del Bloque 2 no tiene ninguna relación con "punto 16" del Bloque 4).

Estas dos numeraciones **nunca deben confundirse entre sí**. A continuación, cada regla de negocio identificada se cataloga con su propio identificador `RB-XXX` estable, indicando entre paréntesis la cita original del código cuando existe.

---

**RB-001 (cita: "Regla 1")** — Nombre: *Movimiento de Financiación exige subtipo*. Descripción: un `Movimiento` con `tipo==='Financiación'` debe indicar `subtipo_financiacion`; si no, se rechaza. Condición: `tipo==='Financiación' && !subtipo_financiacion`. Acción: bloquea el guardado, mensaje `"Rechazado (Regla 1): falta subtipo."`. Entidades afectadas: Movimiento. Pantallas: Movimientos. Consecuencia si se incumple: no aplica — el sistema impide guardar el movimiento sin subtipo.

**RB-002 (sin cita numerada — inferida de `signoMovimiento`)** — Nombre: *El signo económico de un movimiento nunca se guarda como signo, se deriva de tipo/subtipo*. Descripción: `Movimiento.importe` se almacena siempre en positivo (confirmado por el mensaje de interfaz: *"Importe siempre en positivo — el signo lo determina el tipo/subtipo"*, línea próxima a la cita de Regla 6); el signo con el que participa en `saldoInterno()` lo decide `signoMovimiento()` según `tipo` (y `direccion` o `subtipo_financiacion` cuando aplica). Consecuencia si se incumple: un importe negativo guardado por error produciría un doble signo en los cálculos de saldo — **AMBIGUO — REQUIERE DECISIÓN**: no se ha confirmado en este documento si existe una validación explícita en el formulario que impida introducir un importe negativo.

**RB-003 (cita: "Regla 6")** — Nombre: *Las transferencias internas se crean únicamente desde la pestaña Transferencias*. Descripción: garantiza el emparejamiento origen/destino (dos movimientos, uno de salida y uno de entrada, con el mismo importe absoluto) mediante `crearTransferencia()` — nunca se crea un movimiento suelto de `tipo='Transferencia interna'` desde el formulario general de Movimientos. Entidades: Movimiento, Transferencia. Funciones: `crearTransferencia()`. Pantallas: Transferencias.

**RB-004 (cita: "Regla 7")** — Nombre: *Conciliación Parcial o Agrupada exige confirmación explícita*. Descripción: si `tipo !== 'Exacta'`, el campo `confirmado_por` es obligatorio. Condición: `tipo ∈ {'Parcial','Agrupada'} ∧ !confirmadoPor`. Acción: `throw`, no se registra la conciliación. Funciones: `registrarConciliacion()`.

**RB-005 (cita: "Regla 8")** — Nombre: *Nombre de proveedor único (normalizado)*. Descripción: no se admite un proveedor cuyo `nombre_normalizado` ya exista. Mensaje: `"Rechazado (Regla 8): ya existe."`. Pantallas: Proveedores. **NO DEFINIDO** en el material extraído: el algoritmo exacto de normalización (mayúsculas/minúsculas, acentos, espacios) no se transcribió en este documento.

**RB-006 (cita: "Regla 9")** — Nombre: *Una factura en duplicado no resuelto no puede generar vencimientos*. Descripción: mientras `estado_duplicado ∈ {'Posible duplicado','Duplicado confirmado'}`, la factura queda excluida de `facturasElegiblesParaVencimiento()` (F-15) Y, además, `crearVencimientoValidado()` (F-30/5.6) vuelve a validar la misma condición en el momento de escribir — doble aplicación (listado + escritura), nunca solo una. Funciones: `facturasElegiblesParaVencimiento()`, `crearVencimientoValidado()`. Consecuencia si se incumple: `throw` explícito citando "Regla 9" en el mensaje.

**RB-007 (cita: "Regla 10")** — Nombre: *Un vencimiento nace de una Factura o de un CompromisoFijo, nunca de ambos ni de ninguno*. Descripción: exclusividad mutua entre `factura_id` y `compromiso_fijo_id` en `Vencimiento`. Funciones: `crearVencimientoValidado()`. Mensaje: `"Rechazado (Regla 10): falta factura o compromiso."` (y el equivalente cuando ambos están presentes). **Excepción documentada:** `generarVencimientos()` (creación automática en serie desde un `CompromisoFijo`) no pasa por esta función — ver hallazgo 🟠 en Parte 15; no viola la regla en sí (sigue naciendo solo de un compromiso), pero no reutiliza la validación centralizada.

**RB-008 (cita: "Regla 13")** — Nombre: *Actualizar el importe futuro de un compromiso nunca reescribe el histórico*. Descripción: `actualizarImporteCompromiso()` añade un nuevo registro a `importe_historico` en vez de modificar uno existente; solo actualiza vencimientos `Previsto`/`Pendiente` con `fecha >= vigenteDesde`. Funciones: `actualizarImporteCompromiso()`, `importeVigente()`.

**RB-009 (cita: "Regla 3", Bloque 3)** — Nombre: *La posición neta de una familia documental es la suma algebraica, con signo, de todos sus documentos*. Descripción: nunca se reinterpreta el signo de una rectificativa/abono; se suma tal cual el `total` de cada documento de la familia. Funciones: `posicionNetaFactura()`.

**RB-010 (cita: "Regla 4/5", Bloque 3)** — Nombre: *Una factura original puede tener múltiples rectificativas/abonos, y estos pueden encadenarse*. Descripción: `factura_relacionada_id` no se limita a una única relación por documento padre, y la cadena puede tener más de un nivel (Original → Rectificativa A → Rectificativa B). Funciones: `documentosRelacionadosDeFactura()`, `facturaOriginalDe()`.

**RB-011 (sin cita numerada, Bloque 3 punto G)** — Nombre: *La relación documental (tipo_factura + factura_relacionada_id) es inmutable tras la creación*. Descripción: no existe ninguna función de edición de estos dos campos una vez creado el documento. Consecuencia: hace estructuralmente imposible introducir un ciclo *nuevo* (el id de la factura nueva no existe todavía cuando se valida su padre).

**RB-012 (cita: "Regla 8/9", Bloque 3/4 combinadas)** — Nombre: *Un ajuste posterior se aplica primero contra la deuda pendiente; el saldo a favor requiere pago real que lo respalde*. Ver fórmula completa en Parte 5.1 (`posicionPagoFactura`). Esta es la regla económica más importante del sistema de pagos.

**RB-013 (sin cita numerada — Bloque 4 punto 3)** — Nombre: *Un vencimiento ya conciliado nunca se reescribe al llegar una rectificativa/abono*. Descripción: la llegada de un ajuste nunca modifica un vencimiento existente ni su histórico de conciliación; el efecto vive únicamente en `ajusteNoFormalizado` (A'). Consecuencia si se incumple: perdería la trazabilidad de lo realmente pactado (cita literal del comentario).

**RB-014 (sin cita numerada — Bloque 4 punto 4)** — Nombre: *Sin vencimientos no implica "pagada"*. Descripción: si una familia documental no tiene ningún vencimiento registrado, el estado es `'Sin vencimiento registrado'`, y `D`/`S`/`netoPendiente` quedan en `null` — nunca se infiere un pago inexistente.

**RB-015 (sin cita numerada — Bloque 4 punto 6)** — Nombre: *Una sobre-conciliación exige autorización explícita + motivo obligatorio*. Descripción: `registrarConciliacion()` rechaza cualquier exceso sobre el pendiente del vencimiento o sobre el disponible del movimiento, salvo que `autorizarExceso=true` **y** `motivoExceso` no vacío; en ese caso se genera una entrada de auditoría adicional específica (`sobre_conciliacion_autorizada`).

**RB-016 (sin cita numerada — Bloque 2 punto E)** — Nombre: *Tolerancia de redondeo única y centralizada*. Descripción: `TOLERANCIA_REDONDEO_EUR = 0.01` es el único margen admitido para cualquier comparación monetaria de todo el sistema; ninguna función debe definir su propio margen. Ver F-24.

**RB-017 (sin cita numerada — general)** — Nombre: *`estado_pago` nunca se persiste*. Descripción: ni a nivel de documento (`estadoPagoFactura`) ni a nivel de familia (`estadoPagoFamiliaFactura`) existe un campo guardado — ambos se recalculan siempre desde la cadena Factura→Vencimientos→Conciliaciones→Movimientos. Consecuencia: estructuralmente imposible que quede desincronizado en pantalla (cita literal, Parte 5).

**RB-018 (sin cita numerada — general)** — Nombre: *Toda baja es lógica, nunca física, salvo en la limpieza de datos de prueba*. Descripción: `FacturaLinea.estado_linea='Eliminada'`, `Documento.estado_documento='Sustituido'`, etc. — el registro permanece en `db` para trazabilidad. La única excepción es `ejecutarLimpiezaHuerfanos()` operando sobre datos etiquetados `entorno:'prueba'` o huérfanos, nunca sobre datos de `entorno:'produccion'`.

**RB-019 (sin cita numerada — Bloque 2 punto D)** — Nombre: *Una factura sin líneas no es un error, es un estado válido*. Descripción: `tieneLineas(facturaId)=false` es legítimo; la interfaz debe mostrar "Esta factura no tiene desglose por líneas" — nunca se inventan líneas a partir del total ni se obliga a migrar facturas antiguas.

**RB-020 (sin cita numerada — general de fiscalidad)** — Nombre: *Sin desglose fiscal no se infiere un impuesto de 0€*. Descripción: `resumenFiscalFactura()`/`resumenFiscalLineasFactura()` devuelven explícitamente `estado:'No registrado'` cuando no hay datos, nunca un `cuotaTotal:0` que pudiera confundirse con "IGIC al 0% confirmado".

**Reglas citadas por número pero no localizadas en el material aquí extraído:** ninguna — la búsqueda exhaustiva de `"Regla N"` en todo el archivo (4628 líneas) confirma que solo existen citas para N ∈ {1,3,4,5,6,7,8,9,10,13}. **NO DEFINIDO**: no existen "Regla 2", "Regla 11", "Regla 12" en ningún punto del código; si esos números se citan en cualquier documentación externa a este artefacto, son referencias a una numeración que no está (o ya no está) reflejada en el código actual.

---

# PARTE 7 — ESTADOS

## 7.1 `Factura.estado_documental`
Lista cerrada: `['Recibida','En revisión','Validada','Incidencia','Anulada']`. Por defecto: `'Recibida'`. Cambia solo vía `cambiarEstadoDocumentalFactura()`. **AMBIGUO**: sin grafo de transiciones restringido (ver 3.4) — cualquier valor puede pasar a cualquier otro.

## 7.2 `Factura.estado_duplicado`
Lista cerrada: `['No detectado','Posible duplicado','Duplicado confirmado','Falso positivo']`. Por defecto: `'No detectado'` (o derivado del campo legado `estado`/`resuelto_por` vía `derivarEstadoDuplicadoLegacy()` si la factura no está migrada). **CONTRADICCIÓN DETECTADA**: sin función centralizada de cambio (ver 3.3).

## 7.3 `Factura.estado_contable`
Lista cerrada: `['Pendiente','Contabilizada','Revisada']`. Por defecto: `'Pendiente'`. Cambia solo vía `cambiarEstadoContableFactura()`. Efecto lateral: pasar a `'Contabilizada'` fija `fecha_contabilizacion` (una sola vez, no se sobrescribe si ya existía).

## 7.4 Estado de pago del DOCUMENTO (`estadoPagoFactura`, no persistido)
Valores posibles: `'Anulada'` | `'Pendiente'` | `'Pagada'` | `'Parcialmente pagada'`. Entrada: `'Anulada'` si `estado_documental==='Anulada'` (prioridad absoluta sobre cualquier importe). Salida hacia `'Pagada'`: `pagado >= total − 0.01`. Ver F-18.

## 7.5 Estado de pago de la FAMILIA (`estadoPagoFamiliaFactura`, no persistido)
Valores posibles: `'Anulada'` | `'Sin vencimiento registrado'` | `'Pagada con saldo a favor'` | `'Pagada'` | `'Pendiente'` | `'Parcialmente pagada'`. Orden de evaluación exacto (primera condición que se cumple gana): Anulada → sin vencimientos → saldo a favor > 0 → deuda pendiente ≈0 → pagado ≈0 → si no, parcial. Ver 5.2.

## 7.6 `Vencimiento.estado` (almacenado) vs. estado calculado
Almacenado: `'Previsto'` (generado automáticamente, aún no es una obligación formal confirmada) | `'Pendiente'` (dado de alta manualmente o convertido) | `'Pagado'` (fijado únicamente por `registrarConciliacion()` cuando el cálculo lo confirma). Calculado en cualquier momento por `estadoVencimientoCalculado()`: `'Previsto'` (si conciliado≈0 y estaba `Previsto`) | `'Pendiente'` (conciliado≈0 en cualquier otro caso, o parcialmente conciliado) | `'Pagado'` (conciliado ≥ importe−0.01). El campo `coherente` de `detalleVencimiento()` compara ambos sin corregir automáticamente una discrepancia.

## 7.7 `Movimiento.estado`
Valores observados en el código: `'Confirmado'`, `'Conciliado'`. Solo los movimientos en uno de estos dos estados participan en `saldoInterno()` (F-01) y en `movimientosFiltrados()` (F-07); `movimientosDisponibles()` (candidatos a conciliar) exige estrictamente `'Confirmado'`. El paso a `'Conciliado'` lo hace únicamente `registrarConciliacion()` cuando el movimiento queda **totalmente** aplicado. **NO DEFINIDO** en el material extraído: si existe un tercer estado (p. ej. `'Pendiente'`/borrador antes de `'Confirmado'`) para movimientos recién importados — no confirmado en las funciones aquí catalogadas.

## 7.8 `FacturaLinea.estado_linea`
Lista cerrada: `ESTADOS_LINEA_FACTURA = ['Activa','Eliminada']`. `'Eliminada'` es baja lógica exclusivamente (nunca se borra físicamente). Cambia vía `eliminarLogicamenteLineaFactura()`.

## 7.9 `Documento.estado_documento`
Valores observados: `'Activo'`, `'Sustituido'`. Solo puede existir **como máximo un** documento `'Activo'` por factura en un momento dado (`documentoActivo()` usa `.find()`, que devuelve el primero — la invariante de unicidad depende de que `subirDocumentoFactura()` siempre marque el anterior como `'Sustituido'` antes/al crear el nuevo, lo cual el código hace de forma atómica dentro de la misma función).

## 7.10 `CompromisoFijo` — estado activo
**NO DEFINIDO** en el material extraído de este documento: el campo exacto que marca un compromiso como activo/inactivo (p. ej. `activo:boolean`, o ausencia de tal campo) no fue transcrito en los tramos de código citados aquí. Debe confirmarse contra el modelo de datos completo (Parte 2.8) antes de que Lovable construya cualquier lógica de "compromisos vigentes vs. dados de baja".

## 7.11 `Conciliacion.tipo`
Valores usados: `'Exacta'` (por defecto), `'Parcial'`, `'Agrupada'`. `'Parcial'`/`'Agrupada'` exigen `confirmado_por` (RB-004/Regla 7).

---

# PARTE 8 — KPIs

Convención: **NOMBRE · FÓRMULA · ORIGEN DE DATOS · PERIODO · PANTALLA(S) · COMPORTAMIENTO SIN DATOS**.

1. **Saldo total (todas las cuentas)** — `Σ saldoInterno(c.id, hoy)` para cada cuenta. Origen: F-01/F-02. Periodo: instantáneo (hoy). Pantalla: Dashboard. Sin cuentas → `0` (suma vacía).

2. **Cash flow operativo (mes en curso)** — `cashFlowOperativo(primerDíaDelMes, hoy).neto`. Origen: F-08. Periodo: mes calendario en curso, de día 1 a hoy. Pantalla: Dashboard.

3. **Gasto financiero (mes en curso)** — `gastoFinanciero(primerDíaDelMes, hoy).intereses + comisiones`. Origen: F-09. Pantalla: Dashboard.

4. **Diferencia bancaria** — recuento de cuentas cuyo estado (F-03) es `'Requiere revisión'` o `'Informativa'`; muestra `'Cuadrado'` si ninguna. Pantalla: Dashboard. Nivel de alerta visual distinto según si hay alguna `'Requiere revisión'` (clase `alert`) vs. solo `'Informativa'` (clase `warnb`).

5. **Facturas pendientes / Parcialmente pagadas / Pagadas / Sin vencimiento registrado** — recuento de facturas **originales** (excluye rectificativas/abonos) por `estadoPagoFamiliaFactura()`. Origen: F-35 (`resumenPagosGlobal`). Pantalla: Dashboard, panel "Situación de pago de facturas". Nota: "Pagadas" incluye tanto `'Pagada'` como `'Pagada con saldo a favor'` (esta última también incrementa el contador separado `conSaldoAFavor`).

6. **Deuda pendiente total** — `Σ deudaPendiente` (D, de `posicionPagoFactura`) sobre todas las facturas originales. Origen: F-35/F-31. Pantalla: Dashboard.

7. **Saldo a favor por ajustes** — `Σ saldoAFavor` (S). Origen: F-35/F-31. Pantalla: Dashboard. Resaltado visualmente (`warnb`) si > 0.

8. **Vencimientos próximos (30 días) / Importe vencimientos próximos** — recuento e importe pendiente (`importe − vencimientoYaConciliado`) de vencimientos abiertos con `fecha <= hoy+30`. Origen: F-35. Pantalla: Dashboard.

9. **Incoherencias (ajuste no respaldado)** — recuento de facturas con `excesoAjusteNoRespaldado > TOLERANCIA_REDONDEO_EUR`. Origen: F-35/F-31. Pantalla: Dashboard, mostrado como mensaje de error visible (`class="msg err"`) solo si > 0, con el texto literal: *"factura(s) con un ajuste (abono/rectificativa) superior a su obligación y a sus pagos — revísalas: no se ha absorbido ni compensado nada automáticamente."* — **este KPI existe específicamente para hacer visibles los casos donde RB-012/RB-015 detectan una incoherencia de datos, nunca para ocultarla.**

10. **Saldo interno por cuenta** — `saldoInterno(c.id, hoy)`, tabla, una fila por cuenta. Pantalla: Dashboard.

11. **Cash flow operativo — Ingresos / Gastos / Neto (mes en curso)** — desglose de KPI 2. Pantalla: Dashboard. Nota textual del propio panel: *"Excluye transferencias internas, principal de financiación y movimientos ajenos a la farmacia"* — confirma la separación conceptual exigida por el proyecto (Sección 5 de las instrucciones).

12. **Gasto financiero — Intereses / Comisiones (mes en curso)** — desglose de KPI 3. Pantalla: Dashboard.

13. **Próximos vencimientos (30 días), tabla detallada** — fecha, tipo cobro/pago, tipo, importe pendiente, estado. Origen: `vencimientosAbiertos()` + F-10. Pantalla: Dashboard. Sin datos → fila `"Ninguno."`.

14. **Previsión de tesorería a 30/60/90 días** — `previsionTesoreria(dias)` (F-11), tabla con saldo actual, cobros previstos, pagos previstos, previsto. Pantalla: Dashboard.

15. **Alerta de diferencia bancaria (detalle por cuenta)** — cuenta, última fecha de snapshot, diferencia, estado, con matices textuales adicionales (`diasConfirmados`, aviso si el último snapshot tiene más de 3 días sin confirmar). Origen: F-03. Pantalla: Dashboard. Sin cuentas → fila `"Sin cuentas."`.

16. **Comparativa de periodos** (Ingresos, Gastos, Gasto financiero, Cash flow neto — cada uno con variación absoluta y %) — `compararPeriodos()` (F-36), reutiliza literalmente los KPIs 2/3/11/12 sobre dos rangos distintos elegidos por el usuario (mensual/anual/personalizado). Pantalla: Comparativa. Sin desglose por defecto; opcionalmente por categoría/proveedor/método/cuenta.

**Nota sobre duplicación de conceptos entre pantallas (chequeo explícito solicitado en la misión):** el Dashboard usa exclusivamente la versión de **familia** (`estadoPagoFamiliaFactura` / `posicionPagoFactura`, vía `resumenPagosGlobal`). La pantalla "Facturas" (listado general, no la ficha) usa en algunos puntos la versión de **documento** (`estadoPagoFactura` / `importePendienteFactura`, Bloque 1) — ver hallazgo central de la Parte 15. Esto significa que el mismo concepto ("¿está pagada esta factura?") puede mostrar un resultado distinto en el listado de Facturas que en el Dashboard o en la Ficha, cuando la factura tiene rectificativas/abonos asociados (en facturas sin ningún documento relacionado, ambos cálculos coinciden exactamente, porque `obligacionAbierta` y `pagado` de la familia se reducen a los del documento único). **Esto no se ha corregido en este proceso** — se documenta como hallazgo, no se modifica el artefacto.

---

# PARTE 9 — DASHBOARD (y pantalla de arranque "Diagnóstico")

## 9.1 Pantalla de arranque real: "Diagnóstico" (`id==='diagnostico'`), no "Dashboard"

Confirmado en Parte 1.3: la aplicación **no abre** en el Dashboard financiero, sino en una pantalla de diagnóstico técnico del propio almacenamiento. Contenido exacto:

1. **Panel "Salud documental"** — reutiliza `saludDocumental()` (F-39) filtrando explícitamente solo registros de producción (`esProduccion`). Muestra alerta roja si hay facturas sin documento asociado, KPIs (total, con/sin documento, % con documento, documentos activos/sustituidos, posibles duplicados documentales) y un botón para refrescar el uso de `assets` (`refrescarUsoAssets()`).
2. **Panel "Informe de estado del almacenamiento"** — tabla por entidad (`informeEstadoAlmacenamiento()`) con recuento Total/Producción/Prueba/`_test_run`/Huérfanos por cada una de las 13 entidades nombradas explícitamente (`CuentaBancaria, Movimiento, Proveedor, Factura, Vencimiento, CompromisoFijo, SnapshotSaldoBancario, Conciliacion, Transferencia, Categoria, Subcategoria, Documento, Auditoria`). Nota textual literal aclara que `MetodoCobroPago` no es una colección real, es una lista fija en código (`TPV/Bizum/Efectivo/Transferencia`).
3. **Panel "Herramienta de limpieza"** — lista fila a fila cada registro candidato a limpieza (`candidatosLimpieza()`), con colección + etiqueta + motivo; **solo lista, no borra nada** hasta que el usuario marca una casilla de confirmación explícita y pulsa un botón, que entonces invoca `ejecutarLimpiezaHuerfanos(candidatos)`.

Esta pantalla es, por diseño, el punto de control operativo del sistema (verificar que no hay datos de prueba mezclados con producción) más que un resumen financiero — coherente con la Sección 14 ("no destructivo") de las instrucciones del proyecto FARMATRACK, que exige una vía segura y explícita para cualquier eliminación.

## 9.2 Dashboard financiero (`id==='dashboard'`)

Estructura completa, panel por panel (ver fórmulas exactas y comportamiento sin datos en la Parte 8):

1. **Fila de KPIs superior**: Saldo total, Cash flow operativo (mes en curso), Gasto financiero (mes en curso), Diferencia bancaria (con semáforo de alerta: rojo si alguna cuenta `'Requiere revisión'`, ámbar si solo `'Informativa'`).
2. **Panel "Situación de pago de facturas"** — con el texto de advertencia explícito citado en Parte 8 sobre no mezclar deuda pendiente y saldo a favor; KPIs de recuento (pendientes/parciales/pagadas/sin vencimiento) y de importe (deuda pendiente total, saldo a favor total, vencimientos próximos e importe). Mensaje de error visible si hay incoherencias (`excesoAjusteNoRespaldado`).
3. **Panel "Saldo por cuenta"** — tabla simple.
4. **Panel "Cash flow operativo — mes en curso"** — ingresos/gastos/neto, con nota textual que confirma exclusión de transferencias internas y principal de financiación.
5. **Panel "Gasto financiero — mes en curso"** — intereses/comisiones.
6. **Panel "Próximos vencimientos (30 días)"** — tabla detallada.
7. **Panel "Previsión de tesorería"** — tabla a 30/60/90 días.
8. **Panel "Alerta de diferencia bancaria"** — tabla detallada por cuenta con matices textuales de confianza temporal.

**Filtros aplicados:** ninguno seleccionable por el usuario en esta pantalla — todas las cifras son "hoy" / "mes en curso", sin selector de periodo (el selector de periodo existe en la pantalla separada "Comparativa").

**Comportamiento sin datos:** cada tabla tiene su propio texto de "vacío" explícito (`'Sin cuentas.'`, `'Ninguno.'`) en vez de mostrar una tabla vacía sin explicación — patrón consistente en toda la aplicación.

## 9.3 Relación Diagnóstico ↔ Dashboard

Son pantallas **complementarias, no redundantes**: Diagnóstico responde "¿están mis datos limpios y completos?" (integridad técnica); Dashboard responde "¿cómo está la farmacia financieramente?" (Sección 21 del proyecto). Ninguna fórmula del Dashboard depende de pasar antes por Diagnóstico, y viceversa.

---

# PARTE 10 — SISTEMA DE INCIDENCIAS

**No existe un sistema de Incidencias en el artefacto.** Confirmado por búsqueda exhaustiva: no hay colección `incidencias`, no hay pantalla dedicada en `SECTIONS` (Parte 1.3), no hay función de creación/resolución de incidencias, no hay contador en el Dashboard.

Lo único relacionado con el concepto es que `'Incidencia'` es uno de los cinco valores posibles de `Factura.estado_documental` (`ESTADOS_DOCUMENTALES_FACTURA`), fijado exactamente igual que cualquier otro estado documental, vía `cambiarEstadoDocumentalFactura(facturaId, 'Incidencia', ...)`. No tiene: motivo obligatorio, workflow de resolución, asignación de responsable, fecha de vencimiento de la incidencia, ni ninguna otra estructura propia más allá de ser una etiqueta.

**Para Lovable:** si se solicita construir un sistema de Incidencias real, es una funcionalidad **completamente nueva**, no una extensión de algo existente. Debe seguir, por consistencia con el resto del sistema, el mismo patrón ya usado en cualquier otra entidad con estados controlados: colección propia + función de creación con validación + función(es) de cambio de estado con nombre propio + auditoría vía `auditLog()` en cada escritura (ver Parte 17, contrato de implementación).

---

# PARTE 11 — HISTORIAL Y TRAZABILIDAD

## 11.1 Mecanismo único

Toda entrada de auditoría pasa por una única función: `auditLog(entidad, registroId, accion, antes, despues, entorno='produccion')` (línea 135 del código fuente). Escribe en `db.collection('auditoria')` un documento con `{entidad, registro_id, actor:currentActor(), fecha:new Date().toISOString(), accion, valores_antes, valores_despues, entorno}`. Los objetos `antes`/`despues` se clonan con `JSON.parse(JSON.stringify(...))` antes de guardarse (evita referencias vivas).

**Hallazgo importante:** `auditLog()` está envuelta en un `try/catch` que **traga el error silenciosamente** — si la escritura del registro de auditoría falla (p. ej. por un problema de red o de permisos), la función devuelve `null` y solo hace `console.error('auditLog', e)`, **sin relanzar el error**. Esto significa que la operación de negocio principal (p. ej. crear una factura, registrar una conciliación) puede completarse con éxito mientras su entrada de auditoría correspondiente se pierde sin que el usuario lo sepa. Ver hallazgo 🟠 en la Parte 15.

## 11.2 Catálogo de acciones (`accion`) confirmadas en el código

| Acción | Entidad | Disparada por |
|---|---|---|
| `crear` | Factura | Alta manual de factura Normal (inline en `buildSection('facturas')`) |
| `cambiar_estado_documental` | Factura | `cambiarEstadoDocumentalFactura()` |
| `cambiar_estado_contable` | Factura | `cambiarEstadoContableFactura()` |
| `migrar_etapa_d` | Factura | `migrarFacturasEtapaD()` |
| `resolver_duplicado_confirmado` | Factura | Botón "Confirmar duplicado" (inline, ver Parte 3.3) |
| `resolver_no_duplicado` | Factura | Botón "No es duplicado" (inline, ver Parte 3.3) |
| `crear_rectificativa` / `crear_abono` | Factura | `crearDocumentoRelacionadoFactura()` (según `tipoFactura`) |
| `documento_relacionado_creado` | Factura (la original/padre) | `crearDocumentoRelacionadoFactura()` |
| `crear_linea_factura` | FacturaLinea | `crearLineaFactura()` |
| `modificar_linea_factura` | FacturaLinea | `actualizarLineaFactura()` |
| `reordenar_lineas_factura` | Factura | `reordenarLineasFactura()` |
| `eliminar_logico_linea_factura` | FacturaLinea | `eliminarLogicamenteLineaFactura()` |
| `subir_documento` | Documento | `subirDocumentoFactura()` |
| `sustituir_documento` | Documento | `subirDocumentoFactura()` (cuando había un documento activo previo) |
| `documento_sustituido` | Factura | `subirDocumentoFactura()` |
| `documento_asociado` | Factura | `subirDocumentoFactura()` (primera asociación, sin sustitución) |
| `duplicado_confirmado_reutilizado` | Documento | `subirDocumentoFactura()` con `forzarDuplicado=true` |
| `detectar_documento_duplicado` | Documento | `subirDocumentoFactura()` (hash ya existente, sin forzar) |
| `crear_vencimiento_factura` / `crear_vencimiento_compromiso` | Vencimiento | `crearVencimientoValidado()` (según origen) |
| `generar_vencimientos` | *(no confirmado el registro individual)* | detectado como literal en el código; asociado a la generación en serie |
| `actualizar_importe` | CompromisoFijo (histórico) | `actualizarImporteCompromiso()` (registro observado como literal; contexto exacto no transcrito en este documento) |
| `conciliar` | Conciliacion, y también Movimiento (dos entradas distintas, misma acción) | `registrarConciliacion()` |
| `sobre_conciliacion_autorizada` | Conciliacion | `registrarConciliacion()`, solo si hubo exceso autorizado |
| `marcar_pagado` | Vencimiento | `registrarConciliacion()`, solo si el cálculo confirma el pago |
| `eliminar_datos_prueba_huerfanos` | *(registro de sistema)* | `ejecutarLimpiezaHuerfanos()` — cita literal del propio código: *"es esperable que existan entradas de producción como el propio registro de esta limpieza... que no debe borrarse porque es un rastro legítimo, no un resto de prueba."* |
| `exportar_backup` | *(registro de sistema)* | Exportación de backup completo |

**NO DEFINIDO:** no se ha confirmado en el material aquí extraído la existencia de una entrada de auditoría para: alta de `CuentaBancaria`, alta de `SnapshotSaldoBancario`, alta/edición de `Categoria`/`Subcategoria`, alta/edición de `CompromisoFijo` (la creación en sí, distinta de `actualizar_importe`), ni la creación de `Movimiento` estándar (ingreso/gasto manual). Cualquiera de estas puede existir en tramos del código no citados literalmente en este documento; deben confirmarse contra el fuente antes de asumir su ausencia como un hallazgo de auditoría (a diferencia de `crearTransferencia()`, donde la ausencia sí está confirmada por lectura completa de la función — ver F-12 y Parte 15).

## 11.3 Retención

**NO DEFINIDO:** no se ha localizado ninguna política de retención o purga automática de `auditoria` para datos de producción. Los registros de auditoría de producción son, por diseño, permanentes salvo eliminación manual explícita (que el propio sistema advierte no debe hacerse sobre entradas de producción legítimas).

## 11.4 Pantalla "Auditoría"

Confirmado como explícitamente de **solo lectura** (Parte 2.14) — no existe ninguna vía de edición o borrado individual de una entrada de auditoría desde la interfaz. El único borrado posible de entradas de `auditoria` ocurre dentro de `ejecutarLimpiezaHuerfanos()`, y solo sobre entradas que pertenecen a datos de prueba/huérfanos, nunca de producción.

---

# PARTE 12 — VALIDACIONES (CONDICIÓN → RESULTADO)

Catálogo exhaustivo de las validaciones confirmadas en las funciones citadas en este documento. Formato: **CONDICIÓN → RESULTADO**.

**Movimiento**
- `tipo==='Financiación' ∧ !subtipo_financiacion` → rechazado, `"Rechazado (Regla 1): falta subtipo."` (no se guarda).

**Proveedor**
- `nombre_normalizado` ya existe en otro proveedor → rechazado, `"Rechazado (Regla 8): ya existe."`.

**Transferencia (`crearTransferencia`)**
- `cuentaOrigen === cuentaDestino` → `throw new Error('Origen y destino no pueden ser la misma cuenta.')`.

**Vencimiento (`crearVencimientoValidado`)**
- `factura_id ∧ compromiso_fijo_id` (ambos presentes) → `throw` "Regla 10: un vencimiento no puede nacer a la vez de una factura y de un compromiso fijo."
- `!factura_id ∧ !compromiso_fijo_id` (ninguno presente) → `throw` "Regla 10: un vencimiento debe nacer de una factura o de un compromiso fijo."
- `importe` no numérico finito → `throw` "El importe del vencimiento no es un número válido."
- `importe <= 0` → `throw` "El importe de un vencimiento debe ser mayor que cero: no se admiten importes negativos ni cero (un abono se representa como documento relacionado, no como un vencimiento en negativo)."
- `!fecha` → `throw` "El vencimiento necesita una fecha."
- `factura_id` presente pero la factura no existe → `throw` "Factura no encontrada."
- `factura_id` presente y `estadoDuplicadoFactura(f) ∈ {'Posible duplicado','Duplicado confirmado'}` → `throw` "Regla 9: una factura en posible duplicado o duplicado confirmado no puede generar vencimientos hasta resolverse."
- `compromiso_fijo_id` presente pero el compromiso no existe → `throw` "Compromiso fijo no encontrado."

**Conciliación (`validarConciliacion` / `registrarConciliacion`)**
- Vencimiento no encontrado → error en lista `errores`.
- Movimiento no encontrado → error en lista `errores`.
- `importeAplicado <= 0` → error "El importe aplicado debe ser mayor que cero (no hay ningún caso modelado que admita importes negativos o cero)."
- `importeAplicado > pendienteVencimiento + TOLERANCIA_REDONDEO_EUR` → `excedeVencimiento=true`.
- `importeAplicado > disponibleMovimiento + TOLERANCIA_REDONDEO_EUR` → `excedeMovimiento=true`.
- `tipo !== 'Exacta' ∧ !confirmadoPor` → `throw` "Rechazado (Regla 7): una conciliación Parcial o Agrupada exige confirmado_por."
- Hay exceso (vencimiento o movimiento) y `!autorizarExceso` → `throw`, mensaje detallado con ambos importes disponibles.
- Hay exceso y `!motivoExceso` → `throw` "Una sobre-conciliación autorizada exige un motivo explícito: sin motivo no se registra."

**Documento relacionado (`validarNuevaRelacionFactura`)**
- `tipoFactura` no está en `TIPOS_FACTURA` → `throw` "Tipo de factura no válido: …"
- `tipoFactura==='Normal' ∧ facturaRelacionadaId` presente → `throw` "Una factura Normal no puede tener factura_relacionada_id."
- `tipoFactura ∈ {Rectificativa,Abono} ∧ !facturaRelacionadaId` → `throw` "Una factura de tipo … requiere factura_relacionada_id (sin excepción documentada para este caso)."
- `facturaRelacionadaId === facturaIdPropia` → `throw` "Una factura no puede referenciarse a sí misma."
- Factura relacionada indicada no existe → `throw` "La factura relacionada indicada no existe."
- Ciclo detectado al subir la cadena de padres → `throw` "Referencia circular detectada en la cadena de relación de facturas."
- Profundidad de cadena > 200 → `throw` "Cadena de relación de facturas demasiado profunda o corrupta."

**Estado documental / contable de Factura**
- `nuevoEstado ∉` lista cerrada correspondiente → `throw` "Estado documental no válido: …" / "Estado contable no válido: …"
- Factura no encontrada → `throw` "Factura no encontrada."

**Documento original (`subirDocumentoFactura`)**
- `assets` no disponible → `throw` "El almacenamiento de documentos (assets) no está disponible en esta vista."
- Tipo MIME no admitido → `throw` "Tipo de archivo no admitido. Solo se aceptan PDF, JPG, PNG o WEBP."
- `file.size <= 0` → `throw` "El archivo está vacío."
- `file.size > MAX_DOC_BYTES` (10 MB) → `throw` con el tamaño exacto del archivo y el límite.
- Hash ya existe en otra factura (o misma factura, no activo) y `!forzarDuplicado` → no se sube, `resultado:'duplicado_detectado'` (no es un `throw`, es un resultado controlado).

**Validaciones NO encontradas — importante para Lovable:**
- **Fechas:** no se ha localizado ninguna validación que impida una fecha futura en `Movimiento.fecha`, `Factura.fecha`/`fecha_emision`, o que compruebe que `fecha_vencimiento >= fecha_emision`. **NO DEFINIDO.**
- **Duplicidad de número de factura por proveedor:** no se ha localizado una validación de unicidad de `numero_factura` dentro de un mismo `proveedor_id` (la detección de "posible duplicado" mencionada en 3.2 no tiene su algoritmo confirmado en este documento). **NO DEFINIDO.**
- **Importe de Movimiento negativo:** no se ha confirmado una validación explícita en el formulario que impida introducir un valor negativo en el campo de importe (más allá de la convención de guardarlo siempre en positivo, RB-002). **AMBIGUO.**

---

# PARTE 13 — CASOS EXTREMOS

1. **Importe 0€.** Un `Vencimiento` con `importe<=0` es rechazado por `crearVencimientoValidado()` (no se admite ni siquiera 0). Una `Factura` o documento relacionado con `total=0` no tiene ninguna validación que lo impida (**NO DEFINIDO** si el formulario de factura permite 0€).

2. **Importes negativos (Abono).** El `total` de un Abono/Rectificativa se guarda tal cual, con su propio signo — puede ser negativo. Nunca se reinterpreta ni se fuerza a positivo (RB-009).

3. **Pago parcial / sobrepago.** Pago parcial: `estadoPagoFamiliaFactura` devuelve `'Parcialmente pagada'` mientras `0 < pagado < deudaPendiente+pagado`. Sobrepago: bloqueado por defecto en `registrarConciliacion()` salvo autorización explícita + motivo (RB-015); una vez autorizado, el exceso no genera automáticamente un `saldoAFavor` en `posicionPagoFactura()` salvo que la causa sea un ajuste (abono) — un sobrepago autorizado por error humano sin un ajuste que lo respalde quedaría reflejado como una discrepancia entre `pagado` y `obligacionAbierta`, visible pero **no hay una magnitud dedicada distinta de `excesoAjusteNoRespaldado` para "sobrepago sin ajuste"** — **AMBIGUO** si esto necesita su propia magnitud.

4. **Múltiples vencimientos ↔ múltiples pagos (N:N).** Soportado de forma nativa: `vencimientoYaConciliado()` suma todos los detalles de conciliación de un vencimiento (puede tener varios movimientos aplicados), e `importeDisponibleMovimiento()` permite que un mismo movimiento se aplique a varios vencimientos distintos mientras le quede importe libre.

5. **Factura sin líneas.** Estado válido (RB-019), no un error — `tieneLineas()=false`, la interfaz debe mostrarlo explícitamente, nunca inventar líneas desde el total.

6. **Factura sin proveedor.** **NO DEFINIDO**: no se ha confirmado si `proveedor_id` es obligatorio a nivel de validación de escritura (el modelo de datos, Parte 2.6, lo describe como referencia a Proveedor pero no se ha localizado un `throw` explícito si falta). Se documentó en trabajo previo de este proyecto — fuera del alcance de esta lectura del artefacto — un bloqueo de UI relacionado con `proveedor_id` obligatorio en el formulario de facturas; no se repite aquí por no formar parte del código fuente en sí.

7. **Facturas duplicadas.** Bloqueadas de generar vencimientos mientras el `estado_duplicado` no se resuelva (RB-006); la detección en sí no tiene su algoritmo confirmado en este documento (ver 3.2, NO DEFINIDO).

8. **Documentos relacionados inexistentes.** `validarNuevaRelacionFactura()` rechaza explícitamente si `facturaRelacionadaId` no corresponde a ninguna factura existente.

9. **Datos nulos.** Patrón sistemático en todo el código: un campo sin dato se representa como `null` explícito, nunca como `0`, `''`, o un valor inventado — confirmado repetidamente en `resumenFiscalFactura` (`'No registrado'` vs. `0€`), `parcheMigracionEtapaD` (campos sin histórico quedan `null`), `posicionPagoFactura` (`sinVencimientos` → todo `null`).

10. **Fechas inválidas o futuras.** Sin validación confirmada (ver Parte 12) — un `Vencimiento`, `Movimiento` o `Factura` con fecha futura o con formato defectuoso no es rechazado por ninguna función aquí catalogada. **Riesgo documentado, no corregido.**

11. **Vencimientos vencidos (fecha pasada, aún abiertos).** No se ha localizado ninguna escalada automática de estado ni alerta específica más allá de aparecer en "Próximos vencimientos" si su fecha entra en el rango de 30 días consultado, o de quedar fuera de cualquier listado de "próximos" si la fecha ya pasó hace más de 30 días — **NO DEFINIDO** si existe una vista específica de "vencidos" separada de "próximos".

12. **Descuentos.** Dos tipos soportados en línea de factura: `'Porcentual'` (`descuento_valor` en % sobre el importe bruto) y `'Absoluto'` (importe fijo). Se guarda siempre *cómo* se obtuvo (tipo+valor), nunca solo el resultado (punto 9 del comentario del Bloque 2).

13. **IGIC/IVA — modelo genérico.** `impuesto_tipo`/`tipo_impuesto` no validan contra una lista cerrada — el catálogo `IMPUESTOS_INDIRECTOS_SUGERIDOS = ['IGIC','IVA','Exento','No sujeto','No registrado']` es solo sugerido para la interfaz, preparado para ser configurable. El sistema nunca asume que toda factura lleva el mismo impuesto (cita literal).

14. **Tolerancia de redondeo.** `TOLERANCIA_REDONDEO_EUR = 0.01` aplicada uniformemente; toda comparación monetaria del sistema pasa por `dentroDeTolerancia()` o compara directamente contra esta constante — nunca un margen distinto en otra función (RB-016).

15. **Referencia circular en documentos relacionados.** Protegida en dos frentes: `validarNuevaRelacionFactura()` en el momento de crear (impide introducir un ciclo nuevo) y `facturaOriginalDe()`/`documentosRelacionadosDeFactura()` de forma defensiva en tiempo de lectura (por si un dato legado ya trae un ciclo) — nunca cuelgan la interfaz, devuelven `cicloDetectado:true`.

16. **Backup/exportación corrupta.** El lector ZIP propio (`leerZip`) se usa para **releer y autoverificar** el backup recién construido antes de ofrecerlo, según el patrón documentado — mitiga (aunque no elimina) el riesgo de exportar un archivo corrupto sin que el usuario lo sepa.

---

# PARTE 14 — DATOS DE PRUEBA (suite interna `runTests()`)

## 14.1 Mecánica de la suite

`runTests()` (línea 3068) construye un contexto **totalmente aislado** en memoria (`nuevoCtxAislado()`, nunca `liveCtx()`), etiqueta cada escritura con `entorno:'prueba'` y un `_test_run` único (`runId`), deshabilita la navegación y pausa el re-renderizado en vivo mientras corre (`testsRunning`), ejecuta **107 casos nombrados** (confirmado por recuento exacto de llamadas `await caso(...)` en el código fuente) envueltos individualmente en `try/catch` mediante el helper `caso(nombre, fn)`, y se autolimpia por completo en un bloque `finally` — incluyendo los archivos subidos a `assets` durante la prueba (`assetsCreados`). Cita literal del mensaje final: *"Ningún dato de prueba permanece en el almacenamiento: se ha creado y borrado en este mismo run..., incluidos N archivo(s) en assets."*

**Regla estricta de este documento:** la suite **no se ha ejecutado** en el proceso que generó este documento (solo se ha leído su código fuente). El resultado real (pasa/falla) de cada uno de los 107 casos es, por tanto, **PENDIENTE — no ejecutado**, nunca inventado. Cualquier afirmación de "este caso pasa" sin haber corrido `runTests()` sería una suposición presentada como hecho, prohibido por la Sección 20 del proyecto FARMATRACK.

## 14.2 Catálogo completo de los 107 casos, por fase (nombre literal del código)

**Preparación y Motores base (9 casos):** Preparación (cuentas y movimientos base) · B (vencimiento de pago previsto) · D (pago previsto conciliado) · J (un vencimiento saldado con varios movimientos) · A y C (vencimiento de cobro previsto y luego conciliado) · H (cuota compuesta: principal + intereses) · I (un movimiento salda varios vencimientos) · Diferencia bancaria cuadrada (control) · E (diferencia confirmada por evidencia >7 días) · F (diferencia resuelta antes de 7 días) · G (dos snapshots muy separados en el tiempo).

**Fase 3 — Comparativas, informes y categorización (10 casos):** A (comparación de dos meses) · B (comparación interanual) · C (comparación de rango personalizado) · D (informe por categoría) · E (informe por proveedor) · F (informe por método) · G (informe por cuenta) · H (categoría + subcategoría) · I (proveedor con categoría por defecto) · J (usuario cambia la categoría sugerida) · K (modificación de un movimiento registrada en auditoría) · L (modificación de una factura registrada en auditoría) · M,N,O (resolución de posible duplicado, 3 sub-casos en 1).

**Documental — ETAPA C (6 casos):** P (subir documento y asociarlo) · Q (detección de duplicado por hash, reutilización del archivo) · R (sustitución de documento: preserva histórico) · S (rechazo de tipo no soportado / tamaño excesivo) · T (panel de salud documental refleja datos de prueba) · U (backup: exportación y recuperación con lector ZIP independiente).

**ETAPA D·1 — Modelo extendido de factura (13 casos):** 1 migración de factura antigua · 2 factura antigua con posible duplicado · 3 factura antigua con duplicado confirmado · 4 factura sin información fiscal · 5 factura con estado documental · 6 factura con estado de duplicado · 7 estado de pago derivado, nunca guardado · 8 estado contable · 9 moneda EUR sin inventar otros datos · 10 fiscalidad IGIC · 11 fiscalidad IVA · 12 operación sin impuesto · 13 varios tipos fiscales preparados en el modelo.

**ETAPA D·2 — Líneas de factura (16 casos):** 1 factura sin líneas · 2 una línea, fórmula estándar · 3 múltiples líneas, cálculo de totales · 4 descuento porcentual · 5 descuento absoluto · 6 varias líneas con distintos tratamientos fiscales (IGIC/IVA/exento/no sujeto) · 7 líneas y cabecera coinciden exactamente · 8 diferencia de redondeo dentro de tolerancia (no genera falsa incidencia) · 9 diferencia superior a la tolerancia (se expone, nunca se corrige sola) · 10 edición de línea · 11 "recalcular importes" descarta un total manual desactualizado · 12 línea con importes ya fijados por el documento (no se reconstruye una fórmula fiscal) · 13 reordenación de líneas · 14 eliminación lógica, nunca física · 15 auditoría: crear/modificar/reordenar/eliminar línea · 16 backup incluye `factura_lineas.json` y conserva factura↔líneas↔documento.

**ETAPA D·3 — Rectificativas y abonos (23 casos):** 1 factura normal · 2 crear rectificativa · 3 crear abono · 4 rectificativa vinculada aparece en relacionados del original · 5 abono vinculado aparece en relacionados del original · 6 varios abonos sobre la misma factura · 7 varias rectificativas sobre la misma factura · 8 mezcla de rectificativas y abonos · 9 cálculo de posición neta (ejemplos de referencia) · 10 rectificación al alza · 11 rectificación a la baja · 12 líneas en la factura original · 13 líneas en una rectificativa · 14 líneas en un abono · 15 fiscalidad distinta por línea en una rectificativa · 16 rechazo de referencia a sí misma · 17 rechazo de referencia circular · 18 auditoría: creación de rectificativa/abono y asociación con el original · 19 backup: `tipo_factura` y `factura_relacionada_id` se exportan · 20 recuperación del backup preservando una cadena de varios niveles · 21 factura pagada + abono posterior (Caso A) · 22 factura parcialmente pagada + abono (Caso B) · 23 factura pendiente sin pagar + abono (Caso C).

**ETAPA D·4 — Vencimientos, pagos y conciliación (20 casos):** 1 factura con un vencimiento, sin pagar (CASO 1) · 2 factura con varios vencimientos · 3 pago único que salda el vencimiento · 4 pago parcial (CASO 2) · 5 varios pagos, varios vencimientos, N:N completo (ejemplo del punto 8) · 6 factura sin vencimiento: no se inventa ni pago ni vencimiento · 7 sobre-conciliación rechazada · 8 sobre-conciliación autorizada explícitamente, con motivo y auditoría · 9 un mismo movimiento no puede contabilizarse dos veces · 10 abono ANTES del pago (CASO 5) · 11 abono DESPUÉS del pago total: genera saldo a favor (CASO 3) · 12 abono DESPUÉS de un pago parcial (CASO 4) · 13 un ajuste mayor que obligación y pagos se expone como incoherencia, no se absorbe · 14 una rectificativa al alza con su propio vencimiento no se cuenta dos veces · 15 obligación abierta e importe pagado se calculan por separado · 16 el estado de pago es derivado y no existe como campo editable · 17 auditoría de vencimientos y conciliaciones · 18 Regla 9 y Regla 7 siguen vigentes al crear vencimientos y conciliar · 19 resumen global para el dashboard · 20 backup y recuperación: conciliaciones y sus relaciones se preservan.

**SANEAMIENTO B4 (2 casos):** 1 importe de vencimiento: negativo y cero rechazados, positivo aceptado · 2 la vía de escritura es única: mismas reglas por cualquier camino.

**ETAPA D·5.1 — Ficha unificada de factura (3 casos):** A abrir una factura: todos los paneles reciben la MISMA factura · B cambiar de factura: ningún panel conserva datos de la anterior · C refresco de datos: la ficha sigue en la misma factura y ve los datos nuevos.

**Total: 9+13+6+13+16+23+20+2+3 = 105** — nota de reconciliación: el recuento por fase enumerado arriba suma 105 nombres distintos, mientras el recuento mecánico de `await caso(` en el código es **107** (dos casos "M,N,O" y "H (categoría+subcategoría)" agrupan más de un sub-caso bajo una sola llamada `caso()`, lo que explica la diferencia entre "número de llamadas a `caso()`" y "número de escenarios distintos verificados" — **AMBIGUO** cuál de las dos cifras debe citarse como "número de pruebas": 107 llamadas mecánicas, o el número de escenarios lógicos distintos, ligeramente mayor por los casos agrupados).

## 14.3 Casos de prueba propuestos (nuevos, no existentes en el código)

Ninguno se propone en este documento — el mandato de la misión es documentar lo existente, no ampliar la suite. Si en el futuro se añaden casos, deben etiquetarse explícitamente como **CASO DE PRUEBA PROPUESTO** para no confundirse con los 107 ya confirmados en el código fuente.

---

# PARTE 15 — AUDITORÍA INTERNA

Clasificación: 🔴 ERROR CONFIRMADO · 🟠 POSIBLE ERROR / INCONSISTENCIA DE DISEÑO · 🟡 AMBIGÜEDAD · 🟢 CORRECTO (mencionado solo cuando aporta contraste). **Ninguno de estos hallazgos se ha corregido en el artefacto** — el mandato explícito de la misión fue documentar, nunca corregir automáticamente.

### 🟠 H-01 — Duplicación no unificada de la lógica de estado de pago (documento vs. familia)
Dos cadenas de cálculo independientes, escritas por separado, para conceptualmente "¿está pagada esta factura?": `estadoPagoFactura()`/`importePendienteFactura()` (Bloque 1, nivel documento) y `posicionPagoFactura()`/`estadoPagoFamiliaFactura()` (Bloque 4, nivel familia). Ninguna delega en la otra. Coinciden numéricamente en facturas sin rectificativas/abonos, pero pueden divergir en facturas con documentos relacionados. El Dashboard usa la versión de familia (vía `resumenPagosGlobal`); no se ha confirmado en este documento cuál usa cada pantalla del listado "Facturas" frente a la "Ficha". Ver Parte 8, nota final, y Parte 16.

### 🟠 H-02 — Contradicción entre el comentario de diseño y el código real: `resolver_duplicado`
El comentario de cabecera del Bloque 1 promete una función nombrada `resolver_duplicado`; no existe. La resolución de duplicados ocurre inline en los manejadores de clic de la pantalla Facturas, sin pasar por ninguna función reutilizable ni validada — a diferencia de `cambiarEstadoDocumentalFactura()`/`cambiarEstadoContableFactura()`, que sí siguen el patrón prometido. La auditoría sí se registra correctamente en ambos casos (matiz importante, ver Parte 3.3 corregida). **CONTRADICCIÓN DETECTADA** entre documentación interna (comentario) y comportamiento real (código).

### 🟠 H-03 — `generarVencimientos()` no pasa por `crearVencimientoValidado()`
La generación automática en serie desde un `CompromisoFijo` escribe directamente en `db.collection('vencimientos')`, sin pasar por la vía única y validada que sí usa el alta manual. En la práctica no viola ninguna regla (los importes vienen de `importeVigente()`, no de un formulario, y un compromiso siempre cumple la exclusividad factura/compromiso por construcción), pero es una segunda vía de escritura no unificada del mismo tipo de entidad — el "SANEAMIENTO B4" documentado en el propio código cubrió la vía manual, no esta.

### 🟠 H-04 — Dos escrituras sin entrada de auditoría: Snapshot y Transferencia
`crearTransferencia()` (F-12) no llama a `auditLog()` en ningún punto de su cuerpo — a diferencia de prácticamente cualquier otra función de escritura del sistema. La creación de `SnapshotSaldoBancario` desde la pantalla "Snapshots" tampoco se ha confirmado con una llamada a `auditLog()` en el material aquí extraído (**NO DEFINIDO**, requiere confirmación adicional contra el código de esa pantalla concreta, no citado literalmente en este documento). Consecuencia: dos tipos de movimiento de dinero real entre cuentas (transferencias) o de calibración del sistema (snapshots) pueden quedar sin rastro en `auditoria`.

### 🟠 H-05 — `auditLog()` traga errores silenciosamente
`try/catch` interno que solo hace `console.error` y devuelve `null` si la escritura de auditoría falla — la operación de negocio principal no se entera ni se revierte. Un fallo de red o de permisos puntual podría dejar una escritura de negocio sin su correspondiente rastro, sin que nadie lo sepa en el momento.

### 🟡 H-06 — Dos numeraciones de reglas no unificadas
Citas explícitas `"Regla N"` (solo N ∈ {1,3,4,5,6,7,8,9,10,13}) frente a enumeraciones "punto N" que reinician en cada bloque de comentario de ETAPA D. No existe un registro único "Reglas 1–N" canónico en el código. Ver Parte 6.

### 🟡 H-07 — Transiciones de estado sin grafo restringido
`cambiarEstadoDocumentalFactura()` y `cambiarEstadoContableFactura()` solo validan pertenencia a la lista cerrada de valores, no una secuencia permitida. Técnicamente se puede pasar de `'Anulada'` a `'Recibida'`, o de `'Pendiente'` a `'Revisada'` sin pasar por `'Contabilizada'`. No se ha confirmado si esto es una decisión deliberada de flexibilidad o un descuido — se documenta como ambigüedad, no como error.

### 🟡 H-08 — Detección automática de duplicados no localizada
No se ha encontrado en el material aquí extraído la función que *detecta* (no la que *resuelve*) un posible duplicado. Puede existir en una parte del código no citada literalmente en este documento; debe confirmarse antes de que Lovable construya o modifique cualquier lógica relacionada.

### 🟡 H-09 — `moneda:'EUR'` como convención de sistema, no dato verificado al 100%
El propio comentario de `parcheMigracionEtapaD` califica `moneda:'EUR'` como *"una convención de sistema vigente en el 100% de los datos actuales, no un dato histórico por factura"* — es decir, una afirmación **SUPUESTA** por el propio autor del código, no verificada exhaustivamente contra cada registro real. Se traslada aquí como SUPUESTO, no como CONFIRMADO.

### 🟡 H-10 — Ausencia de validación de fechas
Ninguna función catalogada valida que una fecha no sea futura, ni que `fecha_vencimiento >= fecha_emision`, ni el formato de fecha en sí. Ver Parte 12/13.

### 🟡 H-11 — Límite conocido y documentado: rectificativa N:M
El propio código documenta como límite conocido (no como error) que una rectificativa no puede corregir varias facturas originales a la vez — se incluye aquí por completitud del catálogo de auditoría, aunque el propio autor ya lo clasificó como decisión de alcance, no como fallo.

### 🟢 Contraste — funciones donde el diseño declarado coincide exactamente con el código
`cambiarEstadoDocumentalFactura()`, `cambiarEstadoContableFactura()`, `crearVencimientoValidado()`, `registrarConciliacion()`, `validarNuevaRelacionFactura()`, `posicionPagoFactura()` y `TOLERANCIA_REDONDEO_EUR`/`dentroDeTolerancia()` — en los siete, el comentario de diseño que las precede describe exactamente lo que el código hace, sin discrepancia detectada.

---

# PARTE 16 — FUENTES DE VERDAD

Tabla que mapea cada magnitud crítica a su(s) función(es) autorizada(s). Cuando hay más de una, se marca explícitamente como pregunta abierta para Alfonso.

| Magnitud | Función(es) fuente de verdad | Nota |
|---|---|---|
| Saldo de una cuenta en una fecha | `saldoInterno()` | Única. |
| Saldo consolidado de todas las cuentas | `saldoConsolidado()` | Única, reutiliza `saldoInterno()`. |
| Diferencia banco vs. sistema | `diferenciasPorCuenta()` | Única. |
| Cash flow operativo | `cashFlowOperativo()` | Única, reutilizada también por `compararPeriodos()`. |
| Gasto financiero (intereses/comisiones) | `gastoFinanciero()` | Única. |
| Previsión de tesorería | `previsionTesoreria()` | Única. |
| Importe conciliado de un vencimiento | `vencimientoYaConciliado()` | Única — toda la Parte 5 la reutiliza, nunca la reimplementa. |
| Importe disponible de un movimiento | `importeDisponibleMovimiento()` | Única. |
| **Pendiente/estado de pago de una factura** | `estadoPagoFactura()`/`importePendienteFactura()` (documento) **Y** `posicionPagoFactura()`/`estadoPagoFamiliaFactura()` (familia) | ⚠️ **PREGUNTA ABIERTA PARA ALFONSO** — dos fuentes de verdad no unificadas, ver H-01 (Parte 15). Mientras no se decida cuál es la autorizada (o se unifiquen), cualquier pantalla nueva que Lovable construya debe declarar explícitamente cuál de las dos usa y por qué. |
| Desglose fiscal de una factura (resumen) | `resumenFiscalFactura()` (cabecera) **Y** `resumenFiscalLineasFactura()` (líneas) | No son fuentes en conflicto: el propio Bloque 2 declara explícitamente que las líneas son la fuente del **detalle**, la cabecera es el **resumen documental** — pueden diferir, y esa diferencia se expone (`compararTotalesLineasCabecera()`), nunca se corrige sola. |
| Posición neta de una familia documental | `posicionNetaFactura()` | Única para la suma algebraica simple; `posicionPagoFactura()` es la versión completa con las 6 magnitudes T/A/O/P/D/S — no están en conflicto, `posicionPagoFactura()` es superconjunto. |
| Estado calculado de un vencimiento | `estadoVencimientoCalculado()` | Única; se compara con `Vencimiento.estado` guardado solo para detectar incoherencia (`detalleVencimiento().coherente`), nunca para sobrescribirlo automáticamente fuera de `registrarConciliacion()`. |
| Agregado global de pagos para el Dashboard | `resumenPagosGlobal()` | Única — usa la versión de FAMILIA internamente. |
| Salud documental (facturas con/sin documento) | `saludDocumental()` | Única. |
| Elegibilidad de una factura para generar vencimiento | `facturasElegiblesParaVencimiento()` (listado) y la revalidación inline dentro de `crearVencimientoValidado()` (escritura) | Ambas aplican la misma condición (Regla 9); no están en conflicto, son la misma regla aplicada en dos puntos por seguridad (defensa en profundidad), no una duplicación problemática. |

---

# PARTE 17 — CONTRATO DE IMPLEMENTACIÓN PARA LOVABLE

**Nota de procedencia:** las 12 reglas base siguientes reconstruyen el listado numerado que Alfonso indicó explícitamente en el encargo original de esta especificación. Se reproducen con la redacción más fiel disponible en el registro de esta sesión; si Alfonso detecta cualquier matiz de redacción distinto de su intención original, prevalece siempre lo que él quiso decir, no esta reconstrucción.

## 17.1 Las 12 reglas base (Alfonso)

1. **No inventar lógica de negocio.** Cualquier comportamiento no descrito en este documento o en el código fuente del artefacto no debe asumirse ni añadirse por iniciativa propia.
2. **No modificar fórmulas sin autorización.** Ninguna de las fórmulas del catálogo de la Parte 4 se cambia sin que Alfonso lo apruebe explícitamente, aunque se detecte un posible error (se señala, no se corrige unilateralmente).
3. **No eliminar datos.** Ninguna operación de Lovable debe borrar físicamente un registro existente salvo que el propio patrón ya establecido en el artefacto lo contemple (baja lógica, nunca física — RB-018).
4. **No cambiar nombres o significados de entidades sin autorización.** Los nombres de campos, colecciones y funciones catalogados en las Partes 2, 4 y 5 son el contrato — renombrarlos rompe la trazabilidad.
5. **No duplicar cálculos existentes.** Antes de escribir una fórmula nueva, comprobar si ya existe una función que resuelve lo mismo (ver Parte 16, Fuentes de verdad) y reutilizarla.
6. **Utilizar las funciones centrales existentes cuando corresponda.** P. ej., cualquier alta de vencimiento pasa por `crearVencimientoValidado()`, cualquier conciliación por `registrarConciliacion()` — nunca escribir directamente en `db` desde una pantalla nueva si ya existe la función central equivalente.
7. **Mantener trazabilidad.** Toda escritura nueva debe generar su entrada correspondiente en `auditoria` vía `auditLog()`, sin excepción (corrigiendo, de hecho, los huecos ya detectados en H-04, si Alfonso lo autoriza).
8. **Mantener compatibilidad entre pantallas.** Un cambio en una función central (p. ej. `posicionPagoFactura()`) no debe romper ninguna pantalla que ya la consuma (Dashboard, Ficha, Facturas).
9. **Mantener los estados y reglas de negocio.** Las listas cerradas de estados (Partes 2 y 7) y las reglas de negocio (Parte 6) no se alteran sin autorización explícita.
10. **Separar lógica de negocio de presentación.** Cualquier cálculo nuevo va en una función "motor" (como las de la Parte 4), nunca calculado inline dentro del HTML/JS de una pantalla — patrón ya seguido de forma consistente en todo el artefacto.
11. **Señalar cualquier ambigüedad antes de resolverla.** Ante cualquier `AMBIGUO — REQUIERE DECISIÓN` de este documento (o uno nuevo que surja), preguntar a Alfonso antes de decidir por él.
12. **No sustituir una regla documentada por una interpretación propia.** Ante una regla de negocio ya citada en este documento (Parte 6) o en el código, seguirla tal cual está escrita, no una versión "mejorada" sin autorización.

## 17.2 Reglas adicionales que se consideran necesarias, a partir exclusivamente de lo observado en el artefacto

13. **No unificar `estadoPagoFactura`/`estadoPagoFamiliaFactura` (H-01) sin autorización explícita de Alfonso.** Aunque es una duplicación detectada, decidir cuál es la fuente de verdad "oficial" es una decisión de negocio, no una limpieza técnica libre.
14. **Reutilizar siempre `TOLERANCIA_REDONDEO_EUR` y `dentroDeTolerancia()`/`redondearEuros()` para cualquier comparación o redondeo monetario nuevo.** Nunca definir un margen de tolerancia propio en una función nueva (ya es, de hecho, la Regla 16 interna del propio artefacto — RB-016).
15. **Cualquier entidad nueva con estados controlados (p. ej. una futura Incidencia real, ver Parte 10) debe seguir el patrón ya establecido:** colección propia + función de creación con validación propia + función(es) de cambio de estado con nombre propio y lista cerrada de valores + auditoría en cada escritura — el mismo patrón que `Factura`/`Vencimiento`/`Conciliacion` ya siguen.
16. **Preservar el patrón `entorno`/`_test_run` y el aislamiento de la suite de pruebas.** Cualquier función "motor" nueva debe aceptar `ctx=liveCtx()` y (cuando escribe) un parámetro `track` opcional, replicando el patrón ya usado en las ~40 funciones de la Parte 4 — así sigue siendo testeable de forma aislada sin tocar datos de producción, y la suite de pruebas puede seguir creciendo con el mismo mecanismo de autolimpieza.
17. **No completar los `NO DEFINIDO` de este documento inventando una respuesta.** Cuando Lovable necesite un dato marcado `NO DEFINIDO` en este documento (p. ej. el algoritmo exacto de normalización de nombre de proveedor, o la función de detección automática de duplicados), debe leer el código fuente real del artefacto en ese punto exacto antes de construir sobre una suposición — este documento no sustituye al código fuente como fuente última de verdad, lo complementa.

## 17.3 Jerarquía de fuentes cuando este documento y el código difieran

En caso de discrepancia detectada entre esta especificación y el código fuente real del artefacto (por ejemplo, si el artefacto cambia después de la fecha de esta lectura), **el código fuente del artefacto es la fuente de verdad final**, nunca este documento — este documento es una fotografía fiel tomada en la fecha indicada en la cabecera, no un sustituto permanente del código.

---

# PARTE 18 — FORMATO FINAL

Este documento se ha escrito siguiendo, de principio a fin, las siguientes convenciones, verificables por inspección directa de las Partes 1 a 17:

- Markdown limpio, con tablas para todo dato tabular (campos de entidad, KPIs, validaciones, fuentes de verdad) en vez de prosa narrativa.
- Toda fórmula matemática se presenta en bloque de código (` ``` `), nunca descrita solo en palabras.
- Nombres de funciones, campos, colecciones y constantes siempre en `código con comillas invertidas`, exactamente como aparecen en el archivo fuente — nunca traducidos, parafraseados o renombrados.
- Ninguna sección narra "cómo se hizo el análisis" — cada Parte va directa al contenido técnico.
- Las seis etiquetas del marco CONFIRMADO/CALCULADO/SUPUESTO/AMBIGUO — REQUIERE DECISIÓN/NO DEFINIDO/CONTRADICCIÓN DETECTADA se han usado literalmente (en mayúsculas, tal como se define en el preámbulo del documento) en cada punto donde correspondía, nunca disueltas en una frase ambigua.
- Toda cita literal del código fuente (comentarios de diseño, mensajes de error) se marca como cita ("cita literal") y se transcribe entre comillas, sin parafrasear cuando la redacción exacta importa (p. ej. los mensajes de `throw`, que Lovable debe poder replicar tal cual si decide reconstruir la validación).

---

# PARTE 19 — REGLA DE COMPLETITUD (checklist final)

| Requisito de la misión | Cumplido | Referencia |
|---|---|---|
| Analizar el artefacto completo (HTML/JS, modelo de datos, lógica de negocio) | Sí — lectura íntegra de las 4628 líneas del archivo fuente, en una sesión previa a este documento, más extracción quirúrgica adicional con `grep`/`sed` en esta sesión para citar código exacto | Parte 0 (preámbulo) |
| No modificar el artefacto original | Sí — ninguna escritura se ha realizado sobre `db.collection(...)`; solo lecturas del archivo fuente guardado localmente | — |
| Nada inventado; todo NO DEFINIDO/AMBIGUO/CONTRADICCIÓN marcado explícitamente | Sí — usado en Partes 2, 3, 6, 7, 11, 12, 13, 15, 16 | Ver marcadores en cada Parte |
| PARTE 1 — Mapa general | Sí | — |
| PARTE 2 — Modelo de datos completo | Sí | — |
| PARTE 3 — Facturas, ciclo de vida completo | Sí | — |
| PARTE 4 — Catálogo de fórmulas | Sí — 40 fórmulas (F-01 a F-40) | — |
| PARTE 5 — Lógica de pagos, las 7 funciones nombradas | Sí — existencia confirmada explícitamente | — |
| PARTE 6 — Reglas de negocio (RB-XXX) | Sí — 20 reglas (RB-001 a RB-020) | — |
| PARTE 7 — Estados | Sí — 11 grupos de estado | — |
| PARTE 8 — KPIs | Sí — 16 KPIs | — |
| PARTE 9 — Dashboard (y Diagnóstico) | Sí | — |
| PARTE 10 — Incidencias | Sí — confirmado que no existe como sistema | — |
| PARTE 11 — Historial y trazabilidad | Sí — 27 acciones de auditoría catalogadas | — |
| PARTE 12 — Validaciones | Sí | — |
| PARTE 13 — Casos extremos | Sí — 16 casos | — |
| PARTE 14 — Datos de prueba | Sí — 107 casos de la suite interna, enumerados; ejecución NO realizada (marcado PENDIENTE explícitamente) | — |
| PARTE 15 — Auditoría interna | Sí — 0 🔴, 5 🟠, 6 🟡 | — |
| PARTE 16 — Fuentes de verdad | Sí | — |
| PARTE 17 — Contrato de implementación (12 reglas de Alfonso + 5 adicionales) | Sí | — |
| PARTE 18 — Formato final | Sí | — |
| Resumen final de 10 puntos, tras generar el documento | Se entrega a continuación, fuera de este archivo, como mensaje directo | — |

**Limitación reconocida de esta lectura:** algunas funciones de apoyo (algoritmo completo de `sugerirConciliaciones()`, `informeVencimientos()`, `agruparImporte()`, el catálogo exacto de `TIPOS_DOC_PERMITIDOS`, y el detector automático de duplicados si existe fuera de los tramos citados) no se han transcrito en su totalidad literal en este documento — se documentan como `NO DEFINIDO`/`⚪ NO VERIFICABLE` en sus puntos correspondientes en vez de rellenarse con una suposición. Cualquiera de estos puntos debe resolverse releyendo el código fuente exacto del artefacto antes de que Lovable construya sobre ellos.