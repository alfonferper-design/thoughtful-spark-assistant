/**
 * ZIP mínimo (store, sin compresión) y CRC-32, para el Backup / Exportación
 * (F-40). Se implementa a mano porque el paquete de backup debe generarse
 * dentro del servidor sin dependencias nativas, y porque la auto-verificación
 * exige volver a leer el ZIP recién construido y comprobar cada CRC.
 */

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

export function crc32(datos: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i += 1) c = TABLA_CRC[(c ^ datos[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

type EntradaZip = { nombre: string; datos: Uint8Array };

function escribirU32(v: Uint8Array, off: number, n: number) {
  v[off] = n & 0xff;
  v[off + 1] = (n >>> 8) & 0xff;
  v[off + 2] = (n >>> 16) & 0xff;
  v[off + 3] = (n >>> 24) & 0xff;
}

function escribirU16(v: Uint8Array, off: number, n: number) {
  v[off] = n & 0xff;
  v[off + 1] = (n >>> 8) & 0xff;
}

/** Construye un ZIP sin compresión con las entradas dadas. */
export function construirZip(entradas: EntradaZip[]): Uint8Array {
  const codificador = new TextEncoder();
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let offset = 0;

  for (const entrada of entradas) {
    const nombre = codificador.encode(entrada.nombre);
    const crc = crc32(entrada.datos);
    const tam = entrada.datos.length;

    const local = new Uint8Array(30 + nombre.length + tam);
    escribirU32(local, 0, 0x04034b50);
    escribirU16(local, 4, 20);
    escribirU16(local, 6, 0x0800); // nombres en UTF-8
    escribirU16(local, 8, 0); // store
    escribirU16(local, 10, 0);
    escribirU16(local, 12, 0);
    escribirU32(local, 14, crc);
    escribirU32(local, 18, tam);
    escribirU32(local, 22, tam);
    escribirU16(local, 26, nombre.length);
    escribirU16(local, 28, 0);
    local.set(nombre, 30);
    local.set(entrada.datos, 30 + nombre.length);
    locales.push(local);

    const central = new Uint8Array(46 + nombre.length);
    escribirU32(central, 0, 0x02014b50);
    escribirU16(central, 4, 20);
    escribirU16(central, 6, 20);
    escribirU16(central, 8, 0x0800);
    escribirU16(central, 10, 0);
    escribirU16(central, 12, 0);
    escribirU16(central, 14, 0);
    escribirU32(central, 16, crc);
    escribirU32(central, 20, tam);
    escribirU32(central, 24, tam);
    escribirU16(central, 28, nombre.length);
    escribirU16(central, 30, 0);
    escribirU16(central, 32, 0);
    escribirU16(central, 34, 0);
    escribirU16(central, 36, 0);
    escribirU32(central, 38, 0);
    escribirU32(central, 42, offset);
    central.set(nombre, 46);
    centrales.push(central);

    offset += local.length;
  }

  const tamCentral = centrales.reduce((s, c) => s + c.length, 0);
  const fin = new Uint8Array(22);
  escribirU32(fin, 0, 0x06054b50);
  escribirU16(fin, 8, entradas.length);
  escribirU16(fin, 10, entradas.length);
  escribirU32(fin, 12, tamCentral);
  escribirU32(fin, 16, offset);

  const total =
    locales.reduce((s, l) => s + l.length, 0) + tamCentral + fin.length;
  const salida = new Uint8Array(total);
  let p = 0;
  for (const l of locales) {
    salida.set(l, p);
    p += l.length;
  }
  for (const c of centrales) {
    salida.set(c, p);
    p += c.length;
  }
  salida.set(fin, p);
  return salida;
}

export type VerificacionZip = {
  ok: boolean;
  entradas: { nombre: string; bytes: number; crcOk: boolean }[];
  errores: string[];
};

/**
 * Auto-verificación del ZIP recién generado: se recorre la estructura real del
 * archivo y se recalcula el CRC-32 de cada entrada. Un backup que no se
 * verifica no se entrega.
 */
export function verificarZip(zip: Uint8Array): VerificacionZip {
  const decodificador = new TextDecoder();
  const vista = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entradas: VerificacionZip["entradas"] = [];
  const errores: string[] = [];
  let p = 0;

  while (p + 30 <= zip.length && vista.getUint32(p, true) === 0x04034b50) {
    const crcEsperado = vista.getUint32(p + 14, true);
    const tam = vista.getUint32(p + 18, true);
    const largoNombre = vista.getUint16(p + 26, true);
    const largoExtra = vista.getUint16(p + 28, true);
    const nombre = decodificador.decode(zip.subarray(p + 30, p + 30 + largoNombre));
    const inicio = p + 30 + largoNombre + largoExtra;
    const datos = zip.subarray(inicio, inicio + tam);
    const crcOk = crc32(datos) === crcEsperado;
    if (!crcOk) errores.push(`La entrada "${nombre}" no supera la comprobación de integridad.`);
    entradas.push({ nombre, bytes: tam, crcOk });
    p = inicio + tam;
  }

  if (entradas.length === 0) errores.push("El paquete generado no contiene ninguna entrada.");
  return { ok: errores.length === 0, entradas, errores };
}

export function aBase64(datos: Uint8Array) {
  let binario = "";
  const trozo = 0x8000;
  for (let i = 0; i < datos.length; i += trozo) {
    binario += String.fromCharCode(...datos.subarray(i, i + trozo));
  }
  return btoa(binario);
}
