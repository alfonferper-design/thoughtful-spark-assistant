# Roadmap — cierre de seguridad

- [ ] Secretos: SESSION_SECRET (generate_secret) y SITE_PASSWORD (add_secret, la elige el usuario)
- [ ] Migración: cerrar políticas y grants anon/authenticated en cuentas, categorias, proveedores, auditoria, configuracion
- [ ] Gate de clave única: src/lib/gate.functions.ts (unlock/lock/status), ruta /unlock
- [ ] Mover lecturas y escrituras a funciones de servidor protegidas por la sesión (datos.ts, rutas, AppShell)
- [ ] Redirigir a /unlock todo lo no desbloqueado (guard en __root o layout)
- [ ] Retirar MCP: quitar mcpPlugin de vite.config, borrar src/lib/mcp, src/routes/mcp.ts, [.well-known], manifest
- [ ] Verificar build + flujo completo en preview
