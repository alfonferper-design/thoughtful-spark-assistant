/**
 * AMPLIACIÓN EXPLÍCITA DEL USUARIO (no está en el documento original):
 * importación de movimientos desde una hoja de cálculo. Este módulo solo
 * interpreta el archivo y prepara una VISTA PREVIA; no escribe nada. El alta
 * real pasa por la misma función central validada que el alta manual, con
 * origen = 'Importado'.
 */
import { TIPOS_MOVIMIENTO_ALTA, METODOS_COBRO_PAGO } from "./movimientos";

export type FilaImportada = {
  linea: number;
  fecha: string | null;
  importe: number | null;
  tipo: string | null;
  cuenta: string | null;
  concepto: string | null;
  metodo: string | null;
  cuenta_id: string | null;
  errores: string[];
  avisos: string[];
};

export type VistaPreviaImportacion = {
  filas: FilaImportada[];
  validas: number;
  invalidas: number;
  columnasDetectadas: string[];
};

const ALIAS: Record<string, keyof FilaImportada> = {
  fecha: "fecha",
  date: "fecha",
  "fecha operacion": "fecha",
  "fecha valor": "fecha",
  importe: "importe",
  amount: "importe",
  cantidad: "importe",
  tipo: "tipo",
  type: "tipo",
  cuenta: "cuenta",
  account: "cuenta",
  banco: "cuenta",
  concepto: "concepto",
  descripcion: "concepto",
  description: "concepto",
  detalle: "concepto",
  metodo: "metodo",
  "metodo de pago": "metodo",
  "metodo cobro pago": "metodo",
};

function sinAcentos(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** Separador más probable entre coma, punto y coma y tabulador. */
export function detectarSeparador(texto: string) {
  const primera = texto.split(/\r?\n/)[0] ?? "";
  const candidatos = [";", ",", "\t"] as const;
  let mejor: string = ";";
  let max = -1;
  for (const c of candidatos) {
    const n = primera.split(c).length;
    if (n > max) {
      max = n;
      mejor = c;
    }
  }
  return mejor;
}

/** Divide una línea CSV respetando comillas dobles. */
export function partirLinea(linea: string, sep: string) {
  const celdas: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const ch = linea[i]!;
    if (ch === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else entreComillas = !entreComillas;
    } else if (ch === sep && !entreComillas) {
      celdas.push(actual);
      actual = "";
    } else actual += ch;
  }
  celdas.push(actual);
  return celdas.map((c) => c.trim());
}

/** Fechas dd/mm/aaaa, dd-mm-aaaa y aaaa-mm-dd. */
export function normalizarFecha(valor: string): string | null {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!m) return null;
  const dia = m[1]!.padStart(2, "0");
  const mes = m[2]!.padStart(2, "0");
  let anio = m[3]!;
  if (anio.length === 2) anio = `20${anio}`;
  const iso = `${anio}-${mes}-${dia}`;
  return Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) ? null : iso;
}

/** Importes con separador de miles y coma decimal españoles. */
export function normalizarImporte(valor: string): number | null {
  let v = valor.replace(/[€\s]/g, "").trim();
  if (!v) return null;
  const negativoParentesis = /^\(.*\)$/.test(v);
  if (negativoParentesis) v = v.slice(1, -1);
  if (v.includes(",") && v.includes(".")) {
    v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  } else if (v.includes(",")) v = v.replace(",", ".");
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return negativoParentesis ? -n : n;
}

function normalizarTipo(valor: string | null, importe: number | null) {
  if (valor) {
    const v = sinAcentos(valor);
    const encontrado = TIPOS_MOVIMIENTO_ALTA.find((t) => sinAcentos(t) === v);
    if (encontrado) return { tipo: encontrado as string, deducido: false };
    if (v === "cargo" || v === "pago") return { tipo: "Gasto", deducido: true };
    if (v === "abono" || v === "cobro") return { tipo: "Ingreso", deducido: true };
  }
  if (importe !== null) {
    return { tipo: importe < 0 ? "Gasto" : "Ingreso", deducido: true };
  }
  return { tipo: null, deducido: false };
}

function normalizarMetodo(valor: string | null) {
  if (!valor) return null;
  const v = sinAcentos(valor);
  return METODOS_COBRO_PAGO.find((m) => sinAcentos(m) === v) ?? null;
}

/**
 * Interpreta el texto de la hoja (CSV o TSV) y devuelve la vista previa. Las
 * filas con errores se muestran, no se descartan en silencio: el usuario ve
 * exactamente qué no se va a importar y por qué.
 */
export function prepararVistaPrevia(
  texto: string,
  cuentas: { id: string; nombre: string }[],
  cuentaPorDefectoId: string | null,
): VistaPreviaImportacion {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lineas.length === 0) {
    return { filas: [], validas: 0, invalidas: 0, columnasDetectadas: [] };
  }

  const sep = detectarSeparador(texto);
  const cabecera = partirLinea(lineas[0]!, sep).map((c) => sinAcentos(c));
  const mapa = cabecera.map((c) => ALIAS[c] ?? null);
  const hayCabecera = mapa.some((x) => x !== null);
  const cuerpo = hayCabecera ? lineas.slice(1) : lineas;

  const filas = cuerpo.map((linea, idx) => {
    const celdas = partirLinea(linea, sep);
    const crudo: Record<string, string> = {};
    if (hayCabecera) {
      mapa.forEach((campo, i) => {
        if (campo) crudo[campo] = celdas[i] ?? "";
      });
    } else {
      // Orden posicional documentado al usuario: fecha, importe, tipo, cuenta, concepto.
      crudo.fecha = celdas[0] ?? "";
      crudo.importe = celdas[1] ?? "";
      crudo.tipo = celdas[2] ?? "";
      crudo.cuenta = celdas[3] ?? "";
      crudo.concepto = celdas[4] ?? "";
    }

    const errores: string[] = [];
    const avisos: string[] = [];
    const fecha = crudo.fecha ? normalizarFecha(crudo.fecha) : null;
    if (!fecha) errores.push("Fecha no reconocida.");

    const importeCrudo = crudo.importe ? normalizarImporte(crudo.importe) : null;
    if (importeCrudo === null) errores.push("Importe no reconocido.");
    else if (Math.abs(importeCrudo) === 0) errores.push("El importe no puede ser cero.");

    const { tipo, deducido } = normalizarTipo(crudo.tipo ?? null, importeCrudo);
    if (!tipo) errores.push("Tipo no reconocido (Ingreso, Gasto o Financiación).");
    else if (deducido) {
      avisos.push(
        crudo.tipo
          ? `Tipo interpretado como ${tipo} a partir de "${crudo.tipo}".`
          : `Tipo deducido como ${tipo} por el signo del importe.`,
      );
    }
    if (tipo === "Financiación") {
      errores.push("Financiación exige subtipo: dala de alta a mano (Regla 1).");
    }

    let cuenta_id: string | null = null;
    const nombreCuenta = (crudo.cuenta ?? "").trim();
    if (nombreCuenta) {
      const encontrada = cuentas.find((c) => sinAcentos(c.nombre) === sinAcentos(nombreCuenta));
      if (encontrada) cuenta_id = encontrada.id;
      else avisos.push(`No existe una cuenta llamada "${nombreCuenta}": se usará la seleccionada.`);
    }
    if (!cuenta_id) cuenta_id = cuentaPorDefectoId;
    if (!cuenta_id) errores.push("Falta la cuenta.");

    return {
      linea: idx + (hayCabecera ? 2 : 1),
      fecha,
      importe: importeCrudo === null ? null : Math.abs(importeCrudo),
      tipo,
      cuenta: nombreCuenta || null,
      concepto: (crudo.concepto ?? "").trim() || null,
      metodo: normalizarMetodo(crudo.metodo ?? null),
      cuenta_id,
      errores,
      avisos,
    } satisfies FilaImportada;
  });

  return {
    filas,
    validas: filas.filter((f) => f.errores.length === 0).length,
    invalidas: filas.filter((f) => f.errores.length > 0).length,
    columnasDetectadas: hayCabecera ? cabecera : ["fecha", "importe", "tipo", "cuenta", "concepto"],
  };
}
