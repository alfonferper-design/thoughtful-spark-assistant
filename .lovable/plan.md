# Completar Tesorería, Análisis y Diagnóstico

## Resultado
Se sustituirán las seis pantallas provisionales por vistas operativas conectadas a los datos protegidos de Farmatrack, respetando las fórmulas y reglas de la especificación maestra.

## Pantallas

- **Transferencias**: alta entre cuentas distintas, fecha, importe y estado; listado con origen, destino e importe. La operación seguirá siendo atómica y dejará auditoría completa.
- **Saldo bancario**: alta de saldos comunicados por el banco, histórico y tabla de diferencias por cuenta con evidencia temporal real, incluyendo racha confirmada y antigüedad informativa.
- **Panel de indicadores**: todos los indicadores y paneles de las Partes 8 y 9.2: saldos, cash flow, gasto financiero, situación de pagos, próximos vencimientos, previsión 30/60/90 y diferencias bancarias.
- **Comparativa**: dos periodos configurables, dimensión opcional y comparación de ingresos, gastos, gasto financiero y cash flow, con variación absoluta y porcentual.
- **Informes**: filtros por fechas, cuenta, categoría y proveedor; agrupación por dimensión; resumen de movimientos e informe completo de vencimientos.
- **Diagnóstico**: salud documental de producción, recuentos por entidad, duplicados documentales y candidatos seguros de limpieza. El borrado exigirá confirmación explícita y solo afectará datos de prueba o huérfanos.

## Implementación técnica

- Añadir funciones de servidor protegidas para obtener los conjuntos calculados de análisis y diagnóstico, sin exponer acceso directo a la base de datos.
- Reutilizar `TOLERANCIA_REDONDEO_EUR`, `redondearEuros()`, F-03, F-07 a F-13 y F-35 a F-39; no duplicar fórmulas en las vistas.
- Mantener todas las escrituras auditadas y separar estrictamente producción de prueba.
- Marcar las seis entradas como disponibles en la navegación.
- Conservar metadatos únicos de cada pantalla.

## Comprobación

- Verificar compilación y errores de ejecución.
- Recorrer las seis pantallas en escritorio y móvil, comprobando formularios, estados vacíos, tablas y ausencia de solapamientos.
- Probar que Diagnóstico no permite limpiar sin confirmación y nunca propone borrar producción sana.
