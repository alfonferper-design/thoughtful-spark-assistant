import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const estadoPuerta = createServerFn({ method: "GET" }).handler(async () => {
  const { sesionPuerta } = await import("./gate.server");
  const sesion = await sesionPuerta();
  return { desbloqueado: sesion.data.desbloqueado === true };
});

export const desbloquearApp = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ clave: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const esperada = process.env["SITE_PASSWORD"];
    if (!esperada) throw new Error("La clave de la aplicación no está configurada");
    const { claveCoincide, sesionPuerta } = await import("./gate.server");
    if (!claveCoincide(data.clave, esperada)) {
      return { ok: false as const }; // fallo genérico: no revelar nada más
    }
    const sesion = await sesionPuerta();
    await sesion.update({ desbloqueado: true });
    return { ok: true as const };
  });

export const bloquearApp = createServerFn({ method: "POST" }).handler(async () => {
  const { sesionPuerta } = await import("./gate.server");
  const sesion = await sesionPuerta();
  await sesion.clear();
  return { ok: true as const };
});
