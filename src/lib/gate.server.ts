// Solo servidor: sesión cifrada de la puerta de acceso con clave única.
// Nunca importar desde código de cliente; las funciones lo cargan con import()
// dinámico dentro del handler.
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type SesionPuerta = { desbloqueado?: boolean };

export async function sesionPuerta() {
  return useSession<SesionPuerta>({
    password: process.env["SESSION_SECRET"]!,
    name: "farmatrack-gate",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  });
}

export async function requireDesbloqueado() {
  const sesion = await sesionPuerta();
  if (!sesion.data.desbloqueado) {
    throw new Error("No autorizado: introduce la clave de la aplicación");
  }
}

// Comparación resistente a ataques de temporización: se hashean ambos lados
// para igualar longitudes antes de timingSafeEqual.
export function claveCoincide(entrada: string, esperada: string): boolean {
  const a = createHash("sha256").update(entrada, "utf8").digest();
  const b = createHash("sha256").update(esperada, "utf8").digest();
  return timingSafeEqual(a, b);
}
