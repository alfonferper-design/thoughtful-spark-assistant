/**
 * AMPLIACIÓN EXPLÍCITA DEL USUARIO — no forma parte del documento original,
 * que dice literalmente "sin OCR/IA" en esta fase.
 *
 * Lee el archivo de una factura y propone un BORRADOR editable del formulario
 * de alta. No escribe nada en la base de datos: la factura solo se crea cuando
 * el usuario revisa el borrador y pulsa guardar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminAutorizado } from "./admin.server";

export type BorradorFactura = {
  proveedor_nombre: string | null;
  proveedor_cif: string | null;
  proveedor_id: string | null;
  fecha: string | null;
  numero_factura: string | null;
  total: number | null;
  desglose_fiscal: { nombre_impuesto: string; tipo_impositivo: number | null; base: number | null; cuota: number | null }[];
  observaciones: string | null;
  avisos: string[];
};

const ESQUEMA_MODELO = `{
  "proveedor_nombre": string|null,
  "proveedor_cif": string|null,
  "fecha_emision": "AAAA-MM-DD"|null,
  "numero_factura": string|null,
  "total": number|null,
  "desglose_fiscal": [{"nombre_impuesto": string, "tipo_impositivo": number|null, "base": number|null, "cuota": number|null}]
}`;

function normalizarTexto(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const extraerBorradorFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        tipoMime: z.string().min(1),
        contenidoBase64: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<BorradorFactura> => {
    const admin = await adminAutorizado();
    const clave = process.env["LOVABLE_API_KEY"];
    if (!clave) {
      throw new Error(
        "La lectura automática de facturas no está disponible: falta la clave del servicio de IA.",
      );
    }

    const respuesta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un lector de facturas de proveedor españolas. Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta forma, sin texto alrededor y sin bloques de código: " +
              ESQUEMA_MODELO +
              ". Usa null en cualquier campo que no puedas leer con seguridad; nunca inventes datos. Los importes son números con punto decimal, sin símbolo de moneda.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae los datos de esta factura." },
              {
                type: "image_url",
                image_url: { url: `data:${data.tipoMime};base64,${data.contenidoBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.text();
      console.error(`Lectura automática de factura fallida [${respuesta.status}]: ${cuerpo}`);
      if (respuesta.status === 429) {
        throw new Error(
          "Se ha alcanzado el límite de uso de la lectura automática. Inténtalo de nuevo en unos minutos o rellena el formulario a mano.",
        );
      }
      if (respuesta.status === 402) {
        throw new Error(
          "La lectura automática necesita saldo de IA en el espacio de trabajo. Rellena el formulario a mano mientras tanto.",
        );
      }
      throw new Error(`No se pudo leer el archivo automáticamente [${respuesta.status}].`);
    }

    const json = (await respuesta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const texto = json.choices?.[0]?.message?.content ?? "";
    const recorte = texto.replace(/```json|```/g, "").trim();
    let leido: Record<string, unknown>;
    try {
      leido = JSON.parse(recorte) as Record<string, unknown>;
    } catch {
      throw new Error(
        "El archivo se ha leído pero la respuesta no era interpretable. Rellena el formulario a mano.",
      );
    }

    const avisos: string[] = [];
    const nombre = typeof leido["proveedor_nombre"] === "string" ? leido["proveedor_nombre"] : null;
    const cif = typeof leido["proveedor_cif"] === "string" ? leido["proveedor_cif"] : null;

    // El proveedor solo se propone si YA existe: la lectura automática nunca da
    // de alta maestros, y los proveedores son únicos por nombre normalizado.
    let proveedorId: string | null = null;
    const { data: proveedores, error } = await admin
      .from("proveedores")
      .select("id, nombre_visible, nombre_normalizado, cif");
    if (error) throw new Error(error.message);
    if (cif) {
      proveedorId =
        (proveedores ?? []).find(
          (p) => p.cif && p.cif.replace(/[\s-]/g, "").toUpperCase() === cif.replace(/[\s-]/g, "").toUpperCase(),
        )?.id ?? null;
    }
    if (!proveedorId && nombre) {
      const buscado = normalizarTexto(nombre);
      proveedorId =
        (proveedores ?? []).find(
          (p) =>
            normalizarTexto(p.nombre_visible) === buscado ||
            normalizarTexto(p.nombre_normalizado) === buscado,
        )?.id ?? null;
      if (!proveedorId) {
        const parcial = (proveedores ?? []).find(
          (p) =>
            normalizarTexto(p.nombre_visible).includes(buscado) ||
            buscado.includes(normalizarTexto(p.nombre_visible)),
        );
        if (parcial) {
          proveedorId = parcial.id;
          avisos.push(
            `Proveedor propuesto por parecido: "${nombre}" → "${parcial.nombre_visible}". Compruébalo.`,
          );
        }
      }
    }
    if (!proveedorId) {
      avisos.push(
        nombre
          ? `No hay ningún proveedor dado de alta que coincida con "${nombre}": elígelo o créalo antes de guardar.`
          : "No se ha podido leer el proveedor: elígelo a mano.",
      );
    }

    const fecha =
      typeof leido["fecha_emision"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(leido["fecha_emision"])
        ? leido["fecha_emision"]
        : null;
    if (!fecha) avisos.push("No se ha podido leer la fecha con seguridad.");

    const total = typeof leido["total"] === "number" && Number.isFinite(leido["total"]) ? leido["total"] : null;
    if (total === null) avisos.push("No se ha podido leer el total: escríbelo a mano.");

    const desglose = Array.isArray(leido["desglose_fiscal"])
      ? (leido["desglose_fiscal"] as Record<string, unknown>[])
          .map((d) => ({
            nombre_impuesto: typeof d["nombre_impuesto"] === "string" ? d["nombre_impuesto"] : "Impuesto",
            tipo_impositivo: typeof d["tipo_impositivo"] === "number" ? d["tipo_impositivo"] : null,
            base: typeof d["base"] === "number" ? d["base"] : null,
            cuota: typeof d["cuota"] === "number" ? d["cuota"] : null,
          }))
          .filter((d) => d.base !== null || d.cuota !== null || d.tipo_impositivo !== null)
      : [];

    return {
      proveedor_nombre: nombre,
      proveedor_cif: cif,
      proveedor_id: proveedorId,
      fecha,
      numero_factura:
        typeof leido["numero_factura"] === "string" ? leido["numero_factura"] : null,
      total,
      desglose_fiscal: desglose,
      observaciones: null,
      avisos: [
        "Borrador leído del archivo: revisa cada campo antes de guardar. Nada se ha guardado todavía.",
        ...avisos,
      ],
    };
  });
