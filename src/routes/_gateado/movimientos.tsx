import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActor,
  useCategorias,
  useCuentas,
  useMovimientos,
  useProveedores,
  type Movimiento,
} from "@/lib/datos";
import { crearMovimientoValidado } from "@/lib/datos.functions";
import {
  ESTADOS_MOVIMIENTO_ALTA,
  METODOS_COBRO_PAGO,
  SUBTIPOS_FINANCIACION,
  TIPOS_MOVIMIENTO_ALTA,
  fueraDeRangoDeSaldo,
  signoMovimiento,
  type EstadoMovimiento,
  type MetodoCobroPago,
  type SubtipoFinanciacion,
  type TipoMovimientoAlta,
} from "@/lib/movimientos";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/movimientos")({
  head: () => ({
    meta: [
      { title: "Movimientos · Farmatrack" },
      {
        name: "description",
        content:
          "Alta y listado de movimientos de tesorería de la farmacia: ingresos, gastos y financiación.",
      },
      { property: "og:title", content: "Movimientos · Farmatrack" },
      {
        property: "og:description",
        content: "Ingresos, gastos y financiación de la farmacia, con el signo derivado del tipo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaMovimientos,
});

const SIN_VALOR = "__ninguno__";

function PantallaMovimientos() {
  const { data: movimientos, isLoading } = useMovimientos();
  const { data: cuentas } = useCuentas();
  const { data: categorias } = useCategorias();
  const { data: proveedores } = useProveedores();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [guardando, setGuardando] = useState(false);
  const [cuentaId, setCuentaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [importe, setImporte] = useState("");
  const [tipo, setTipo] = useState<TipoMovimientoAlta>("Gasto");
  const [subtipo, setSubtipo] = useState<SubtipoFinanciacion | "">("");
  const [proveedorId, setProveedorId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [metodo, setMetodo] = useState<MetodoCobroPago | "">("");
  const [estado, setEstado] = useState<EstadoMovimiento>("Confirmado");
  const [relacionado, setRelacionado] = useState(true);

  const categoriasRaiz = useMemo(
    () => (categorias ?? []).filter((c) => !c.categoria_padre_id),
    [categorias],
  );
  const subcategorias = useMemo(
    () => (categorias ?? []).filter((c) => c.categoria_padre_id === categoriaId),
    [categorias, categoriaId],
  );

  const cuentaElegida = (cuentas ?? []).find((c) => c.id === cuentaId);
  const avisoFuera =
    cuentaElegida && fecha ? fueraDeRangoDeSaldo(cuentaElegida, fecha) : false;

  const esFinanciacion = tipo === "Financiación";

  const nombreCuenta = (id: string) =>
    (cuentas ?? []).find((c) => c.id === id)?.nombre ?? "—";
  const nombreCategoria = (id: string | null) =>
    id ? ((categorias ?? []).find((c) => c.id === id)?.nombre ?? "—") : "—";
  const nombreProveedor = (id: string | null) =>
    id ? ((proveedores ?? []).find((p) => p.id === id)?.nombre_visible ?? "—") : "—";

  // F-14: al elegir proveedor se sugiere su categoría por defecto.
  function elegirProveedor(id: string) {
    const valor = id === SIN_VALOR ? "" : id;
    setProveedorId(valor);
    const prov = (proveedores ?? []).find((p) => p.id === valor);
    if (prov?.categoria_defecto_id) {
      setCategoriaId(prov.categoria_defecto_id);
      setSubcategoriaId("");
    }
  }

  function elegirCategoria(id: string) {
    setCategoriaId(id === SIN_VALOR ? "" : id);
    setSubcategoriaId("");
  }

  const proveedorActual = (proveedores ?? []).find((p) => p.id === proveedorId);
  const clasificacionPrevista = !categoriaId
    ? null
    : proveedorActual?.categoria_defecto_id === categoriaId
      ? "automatica"
      : "manual";

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!cuentaId) {
      toast.error("Elige la cuenta del movimiento");
      return;
    }
    const valor = Math.abs(Number(importe.replace(",", ".")));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("El importe debe ser un número mayor que cero");
      return;
    }
    if (esFinanciacion && !subtipo) {
      toast.error("Rechazado (Regla 1): falta subtipo.");
      return;
    }
    setGuardando(true);
    try {
      await crearMovimientoValidado({
        data: {
          cuenta_id: cuentaId,
          fecha,
          importe: valor,
          tipo,
          subtipo_financiacion: esFinanciacion ? (subtipo as SubtipoFinanciacion) : null,
          categoria_id: categoriaId || null,
          subcategoria_id: subcategoriaId || null,
          proveedor_id: proveedorId || null,
          metodo_cobro_pago: esFinanciacion ? null : (metodo || null),
          estado: estado as "Previsto" | "Pendiente" | "Confirmado",
          relacionado_con_farmacia: relacionado,
          entorno: "produccion",
          actor,
        },
      });
    } catch (error) {
      setGuardando(false);
      toast.error((error as Error).message);
      return;
    }
    setGuardando(false);
    await queryClient.invalidateQueries({ queryKey: ["movimientos"] });
    await queryClient.invalidateQueries({ queryKey: ["saldos-internos"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success("Movimiento creado");
    setImporte("");
    setSubtipo("");
  }

  return (
    <AppShell
      titulo="Movimientos"
      descripcion="Importe siempre en positivo — el signo lo determina el tipo/subtipo."
    >
      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cuenta</Label>
                <Select value={cuentaId} onValueChange={setCuentaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cuentas ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                {avisoFuera && (
                  <p className="text-xs text-muted-foreground">
                    Esta fecha es anterior al saldo de apertura de la cuenta, así que este
                    movimiento no entrará en el saldo interno.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="importe">Importe (€)</Label>
                <Input
                  id="importe"
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
                <p className="text-xs text-muted-foreground">
                  Siempre en positivo. El signo lo determina el tipo/subtipo.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => {
                    setTipo(v as TipoMovimientoAlta);
                    if (v === "Financiación") setMetodo("");
                    else setSubtipo("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MOVIMIENTO_ALTA.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Las transferencias internas se crean únicamente desde la pantalla
                  Transferencias (Regla 6).
                </p>
              </div>

              {esFinanciacion && (
                <div className="space-y-1.5">
                  <Label>Subtipo de financiación</Label>
                  <Select
                    value={subtipo}
                    onValueChange={(v) => setSubtipo(v as SubtipoFinanciacion)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Obligatorio (Regla 1)" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBTIPOS_FINANCIACION.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Select value={proveedorId || SIN_VALOR} onValueChange={elegirProveedor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_VALOR}>Sin proveedor</SelectItem>
                    {(proveedores ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre_visible}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={categoriaId || SIN_VALOR} onValueChange={elegirCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_VALOR}>Sin categoría</SelectItem>
                    {categoriasRaiz.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clasificacionPrevista && (
                  <p className="text-xs text-muted-foreground">
                    Clasificación: {clasificacionPrevista === "automatica" ? "automática" : "manual"}
                  </p>
                )}
              </div>

              {categoriaId && subcategorias.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Subcategoría</Label>
                  <Select
                    value={subcategoriaId || SIN_VALOR}
                    onValueChange={(v) => setSubcategoriaId(v === SIN_VALOR ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_VALOR}>Sin subcategoría</SelectItem>
                      {subcategorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!esFinanciacion && (
                <div className="space-y-1.5">
                  <Label>Método de cobro/pago</Label>
                  <Select
                    value={metodo || SIN_VALOR}
                    onValueChange={(v) => setMetodo(v === SIN_VALOR ? "" : (v as MetodoCobroPago))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SIN_VALOR}>Sin especificar</SelectItem>
                      {METODOS_COBRO_PAGO.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as EstadoMovimiento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_MOVIMIENTO_ALTA.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  «Conciliado» no se elige aquí: lo asigna el motor de conciliación.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="relacionado" className="text-sm font-normal">
                  Relacionado con la farmacia
                </Label>
                <Switch
                  id="relacionado"
                  checked={relacionado}
                  onCheckedChange={setRelacionado}
                />
              </div>

              <Button type="submit" disabled={guardando} className="w-full">
                {guardando ? "Guardando…" : "Crear movimiento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Movimientos registrados
              <span className="tabular ml-2 text-muted-foreground">
                {movimientos?.length ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando…</p>
            ) : !movimientos?.length ? (
              <p className="p-6 text-sm text-muted-foreground">
                Todavía no hay movimientos. Crea el primero con el formulario.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead className="text-right">Efecto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Clasificación</TableHead>
                    <TableHead>Farmacia</TableHead>
                    <TableHead>Entorno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(movimientos as Movimiento[]).map((m) => {
                    const signo = signoMovimiento(m);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="tabular font-mono text-xs">{m.fecha}</TableCell>
                        <TableCell>{nombreCuenta(m.cuenta_id)}</TableCell>
                        <TableCell>
                          {m.tipo}
                          {m.subtipo_financiacion && (
                            <span className="block text-xs text-muted-foreground">
                              {m.subtipo_financiacion}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="tabular text-right font-mono">
                          {formatoEuros(Math.abs(Number(m.importe)))}
                        </TableCell>
                        <TableCell className="tabular text-right font-mono">
                          {signo === 0 ? "0" : signo > 0 ? "+" : "−"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {nombreCategoria(m.categoria_id)}
                          {m.subcategoria_id && (
                            <span className="block text-xs text-muted-foreground">
                              {nombreCategoria(m.subcategoria_id)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{nombreProveedor(m.proveedor_id)}</TableCell>
                        <TableCell className="text-sm">{m.metodo_cobro_pago ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={m.estado === "Confirmado" ? "secondary" : "outline"}>
                            {m.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.clasificacion_origen ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.relacionado_con_farmacia ? "Sí" : "No"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.entorno}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
