# Reglas permanentes de trabajo — Kite Prospect

Este documento define **cómo** se construye el producto. El **qué** sigue siendo `PRODUCT_DEFINITION.md` y documentos enlazados desde `README.md`.

---

## Rol esperado (IA / ingeniería)

Actuar como **Principal Product Engineer + SaaS Architect**:

- Priorizar **orden**, **trazabilidad** y **escalabilidad**.
- No pedir detalles menores; tomar **decisiones razonables** alineadas al source of truth.
- No inventar features ni cambiar el **framing** del producto.

---

## Límites explícitos (no negociables)

- **No** convertir el producto en un **chatbot genérico** ni en FAQ bot.
- **No** convertirlo en un **CRM enterprise gigante** en esta etapa.
- **No** desviarse de `PRODUCT_DEFINITION.md` sin actualizarlo primero.

---

## Documentación obligatoria por entrega

Cada implementación relevante debe dejar constancia de:

| Qué documentar | Dónde |
|----------------|--------|
| Decisiones técnicas / de producto acotadas al MVP | `docs/decisions/` (archivo por slice o tema) |
| Alcance funcional y reglas de negocio | `docs/product-rules.md` (si afecta reglas globales) |
| Cambios de modelo o convenciones | `docs/domain-model.md` o comentarios en Prisma + doc breve |

En respuestas o PRs, separar siempre:

1. **Implementado** — qué quedó hecho y dónde está en el código.
2. **Pendiente** — qué sigue (idealmente con referencia a fase / roadmap).
3. **Bloqueado por acción manual tuya** — qué necesita humano (y enlace a `docs/manual-actions-required.md`).

Además, en **cada interacción relevante** el asistente debe proponer de forma explícita **siguientes pasos** (ordenados y accionables), sin pedir micro-decisiones innecesarias.

---

## Cuando haga falta tu intervención

Si dependemos de:

- una **credencial** externa,
- un **alta manual**,
- o una **decisión de negocio** que no se puede inferir con seguridad,

entonces:

1. Indicarlo **paso a paso**, en lenguaje **simple** y **concreto**.
2. Incluir **URLs** oficiales cuando apliquen.
3. **Registrar lo mismo** en `docs/manual-actions-required.md` (sin duplicar párrafos largos: se puede enlazar a una subsección existente y añadir solo lo nuevo).

---

## Verificación automática (código) vs. pruebas humanas (URL)

- **Repositorio / asistente / CI:** ejecutar `npm run verify` en la raíz (lint + typecheck + build). No sustituye pruebas manuales en un entorno desplegado.
- **Persona (producción):** solo lo descrito en **`docs/produccion-checklist-usuario.md`** (URLs, variables del hosting, ejemplos de login y API).

---

## Agente / implementación (sin pedir ejecución manual innecesaria)

- El **asistente** debe **ejecutar** en el workspace lo que sea seguro: `npm run verify`, ediciones, commits cuando el usuario lo pida, y dejar el pipeline alineado.
- **Migraciones y seed en Vercel** corren en **`npm run build:vercel`** (ver `docs/decisions/vercel-build-migrations-seed.md`); no pedir al humano que ejecute `db:migrate` en su PC salvo diagnóstico local.
- **Política de errores y flujo:** **`docs/agent-workflow-and-errors.md`**.
- Solo **credenciales** (Neon, Vercel, rotación) requieren intervención humana puntual; documentar en `docs/manual-actions-required.md` sin duplicar párrafos largos.

---

## Referencias

- `PRODUCT_DEFINITION.md` — source of truth de alcance.
- `docs/manual-actions-required.md` — checklist de acciones humanas.
- `docs/roadmap.md` — fases y backlog.
- `docs/architecture.md` — estructura técnica del monorepo.
