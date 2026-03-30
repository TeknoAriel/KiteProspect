# Plantillas de planes de seguimiento — leads inmobiliarios (3 / 6 / 9 / 12 pasos)

**Fecha:** 2026-03-30  
**Contexto:** análisis comercial + alineación técnica con `FollowUpPlan.sequence` (JSON) y `processDueFollowUps` (`apps/web/src/domains/followups/services/process-due-follow-ups.ts`).

## Cómo interpreta el producto cada paso (hoy)

| Campo | Uso |
|--------|-----|
| `step` | Índice lógico (opcional; si falta, usa posición en el array). |
| `delayHours` | Tras **completar** el paso `N-1`, espera **estas horas** antes de ejecutar el paso `N`. El `delayHours` del **paso 0** no programa el primer disparo (eso lo define `nextAttemptAt` de la secuencia). |
| `channel` | `whatsapp` → envío real vía Meta (si está configurado). Otros valores → intento registrado `queued` **sin envío automático** en MVP (operador ve el objetivo y actúa en email / IG / llamada según proceso manual o integraciones futuras). |
| `objective` | Texto del mensaje si `channel === "whatsapp"` (truncado); además queda en `FollowUpAttempt` para trazabilidad. |

**“Canales paralelos” (mismo día, mail + IG o WA + IG):** el motor no tiene un solo paso con dos canales. Equivalente operativo: **dos entradas consecutivas** en el JSON con `delayHours: 0` en la segunda del par (misma ventana temporal; el cron las procesará en corridas sucesivas).

**Límites de producto:** respetar consentimiento por canal (`Consent`), opt-out y política anti-spam (`docs/product-rules.md`). No es campaña masiva: secuencias por lead cualificado.

---

## Convención de tiempos sugerida

- **Corto (3 pasos):** horas típicas entre toques: `0 → 24 → 72` (día 0, día 1, día 3).
- **Medio (6):** espaciar 12–48 h al inicio, luego 48–96 h.
- **Largo (9–12):** añadir “mantenimiento” semanal o quincenal al final (objetivo: permanecer en radar sin presionar).

Los números de `delayHours` en las plantillas son **orientativos**; cada inmobiliaria debe ajustarlos a su SLA y a horario comercial.

---

## Plantilla A — 3 reintentos (lead frío / reactivación rápida)

**Nombre sugerido:** `Reactivación corta (3)`  
**Uso:** consulta antigua, baja prioridad, o prueba A/B antes de largas series.

| # | Objetivo del envío | Canal sugerido | Notas |
|---|-------------------|----------------|--------|
| 1 | Reconocer la consulta y ofrecer **una** pregunta concreta (zona / presupuesto / timing). | `whatsapp` | Primer contacto humano-asistido. |
| 2 | Enviar **2–3 propiedades reales** del inventario (enlace o referencia), sin inventar datos. | `whatsapp` | Si no hay match, objetivo = pedir criterio para buscar. |
| 3 | Cierre suave: “¿Seguimos buscando o preferís que cerremos por ahora?” + opción visita. | `email` | En MVP queda `queued`; operador puede enviar mail o WA manual desde ficha. |

**`maxAttempts`:** 3 (o mayor si querés margen de reintentos por fallos técnicos).

```json
[
  { "step": 0, "delayHours": 0, "channel": "whatsapp", "objective": "Hola, soy de [inmobiliaria]. Vi tu consulta sobre vivienda. ¿Seguís buscando? Si me decís zona aproximada y rango de precio, te comparto opciones reales de nuestro inventario." },
  { "step": 1, "delayHours": 24, "channel": "whatsapp", "objective": "Te paso opciones que tenemos publicadas hoy (sin inventar datos). Si ninguna encaja, contame qué cambiarías y seguimos." },
  { "step": 2, "delayHours": 72, "channel": "email", "objective": "Cierre suave: ¿querés que sigamos la búsqueda o lo damos por cerrado por ahora? Si querés, coordinamos visita con lo que viste." }
]
```

---

## Plantilla B — 6 reintentos (recorrido estándar)

**Nombre sugerido:** `Embudo estándar (6)`  
**Uso:** lead con perfil parcial; combina rapidez al inicio y pausas después.

| # | Objetivo | Canal | Paralelo opcional |
|---|----------|--------|-------------------|
| 1 | Saludo + validación de interés (compra/alquiler/inversión). | `whatsapp` | — |
| 2 | Profundizar: zona + ambientes + obra o usado. | `whatsapp` | — |
| 3 | **Par:** recordatorio por segundo canal si tenés consentimiento mail + IG. | `email` luego `instagram` | Mismo día: segundo paso con `delayHours: 0`. |
| 4 | Enviar match desde inventario o pedir refinamiento. | `whatsapp` | — |
| 5 | Propuesta de visita o llamada con horario. | `whatsapp` | — |
| 6 | Último toque: “¿pausamos o seguimos en X días?” | `email` | — |

```json
[
  { "step": 0, "delayHours": 0, "channel": "whatsapp", "objective": "Hola, gracias por tu consulta. Para orientarte bien: ¿buscás compra, alquiler o inversión? Y ¿zona preferida?" },
  { "step": 1, "delayHours": 12, "channel": "whatsapp", "objective": "Perfecto. ¿Cuántos ambientes y aproximadamente qué presupuesto? Así filtramos solo lo que tenemos publicado." },
  { "step": 2, "delayHours": 24, "channel": "email", "objective": "Te dejamos un resumen por correo (mismo mensaje que por WhatsApp). Si preferís Instagram, respondemos por DM con el mismo criterio." },
  { "step": 3, "delayHours": 0, "channel": "instagram", "objective": "[DM] Mismo seguimiento que email: zona + presupuesto ya comentados; ofrecer 1 propiedad concreta del inventario si aplica." },
  { "step": 4, "delayHours": 48, "channel": "whatsapp", "objective": "Según lo que hablamos, estas son opciones que tenemos hoy (enlaces / refs). ¿Alguna te interesa para visitar?" },
  { "step": 5, "delayHours": 72, "channel": "whatsapp", "objective": "¿Te parece agendar visita o llamada corta esta semana? Decime dos franjas horarias." },
  { "step": 6, "delayHours": 96, "channel": "email", "objective": "Último mensaje del seguimiento automático: si querés que sigamos la búsqueda, respondé; si no, damos por cerrado sin molestar más." }
]
```

Nota: hay **7** objetos en el array; para **exactamente 6 toques** ajustá eliminando un paso o fusionando email+IG en un solo paso manual. Ajuste típico: quitar `instagram` y dejar solo `email` como segundo canal del día 3.

**Versión estricta 6 pasos (sin IG en JSON):**

```json
[
  { "step": 0, "delayHours": 0, "channel": "whatsapp", "objective": "Saludo + compra/alquiler/inversión + zona." },
  { "step": 1, "delayHours": 12, "channel": "whatsapp", "objective": "Ambientas + presupuesto + timing." },
  { "step": 2, "delayHours": 24, "channel": "whatsapp", "objective": "Compartir 1–2 propiedades reales del inventario o pedir dato faltante." },
  { "step": 3, "delayHours": 48, "channel": "email", "objective": "Mismo contenido útil por mail (operador / integración futura)." },
  { "step": 4, "delayHours": 72, "channel": "whatsapp", "objective": "Propuesta de visita o llamada." },
  { "step": 5, "delayHours": 120, "channel": "whatsapp", "objective": "Cierre: ¿seguimos, pausamos o cerramos?" }
]
```

---

## Plantilla C — 9 reintentos (nutrición + visita)

**Nombre sugerido:** `Nutrición 9 toques`  
**Uso:** lead con buen fit pero decisión lenta; mezcla valor (contenido / stock) y pedido de acción.

Estructura sugerida:

1–2: cualificación rápida (WA).  
3–4: **par** mail + otro canal el mismo día (`delayHours: 0`) si aplica consentimiento.  
5–6: propiedades + objeciones.  
7–8: visita / financiación / comparables.  
9: cierre o pausa explícita.

```json
[
  { "step": 0, "delayHours": 0, "channel": "whatsapp", "objective": "Apertura + confirmación de interés." },
  { "step": 1, "delayHours": 8, "channel": "whatsapp", "objective": "Perfil: zona, tipología, presupuesto." },
  { "step": 2, "delayHours": 24, "channel": "whatsapp", "objective": "Primera propiedad concreta del inventario + pregunta única." },
  { "step": 3, "delayHours": 24, "channel": "email", "objective": "Resumen escrito + enlaces permitidos (inventario real)." },
  { "step": 4, "delayHours": 0, "channel": "instagram", "objective": "DM: mismo hilo comercial; no prometer disponibilidad no verificada." },
  { "step": 5, "delayHours": 48, "channel": "whatsapp", "objective": "Segunda o tercera opción o ajuste de criterios." },
  { "step": 6, "delayHours": 48, "channel": "whatsapp", "objective": "Manejo de objeción (precio / ubicación / timing)." },
  { "step": 7, "delayHours": 72, "channel": "whatsapp", "objective": "Propuesta de visita presencial o videollamada." },
  { "step": 8, "delayHours": 96, "channel": "email", "objective": "Recordatorio de visita o material adicional (sin spam)." },
  { "step": 9, "delayHours": 168, "channel": "whatsapp", "objective": "Cierre: continuar, pausar hasta fecha X, o descartar con respeto." }
]
```

Hay **10** pasos en el array; para **9 toques** eliminar uno (p. ej. paso 8 o fusionar 3–4 solo en WA).

---

## Plantilla D — 12 reintentos (persistencia controlada)

**Nombre sugerido:** `Largo plazo (12) — alto valor`  
**Uso:** solo leads `real_lead` / `hot` o score alto; evitar fatiga en exploratory.

Idea: **3 fases** de 4 toques:

- **Fase 1 (días 0–7):** WA + email, alta frecuencia.  
- **Fase 2 (días 8–30):** WA + **par** WA+IG un día (`delayHours: 0` entre dos pasos).  
- **Fase 3 (día 30+):** chequeos quincenales hasta cierre o pausa.

Ejemplo compacto (ajustá delays):

```json
[
  { "step": 0, "delayHours": 0, "channel": "whatsapp", "objective": "Bienvenida + confirmación de consulta." },
  { "step": 1, "delayHours": 6, "channel": "whatsapp", "objective": "Cualificación express." },
  { "step": 2, "delayHours": 18, "channel": "whatsapp", "objective": "Primera propiedad / pedido de datos faltantes." },
  { "step": 3, "delayHours": 24, "channel": "email", "objective": "Resumen + enlaces." },
  { "step": 4, "delayHours": 48, "channel": "whatsapp", "objective": "Seguimiento stock / novedades reales." },
  { "step": 5, "delayHours": 48, "channel": "whatsapp", "objective": "Visita o llamada." },
  { "step": 6, "delayHours": 72, "channel": "whatsapp", "objective": "Recordatorio suave." },
  { "step": 7, "delayHours": 0, "channel": "instagram", "objective": "DM alineado al mismo lead (consentimiento)." },
  { "step": 8, "delayHours": 96, "channel": "whatsapp", "objective": "Nueva opción de inventario o cambio de criterio." },
  { "step": 9, "delayHours": 168, "channel": "email", "objective": "Check-in quincenal (valor, no presión)." },
  { "step": 10, "delayHours": 336, "channel": "whatsapp", "objective": "Última propuesta de contacto humano." },
  { "step": 11, "delayHours": 336, "channel": "whatsapp", "objective": "Cierre explícito del seguimiento automático; ofrecer reactivación bajo demanda." }
]
```

---

## Resumen: canales paralelos (WA + IG) o (mail + IG)

| Patrón | En JSON hoy |
|--------|-------------|
| Mismo día, dos canales | Paso K (`email`) con `delayHours` que corresponda al siguiente paso; paso K+1 (`instagram` o `whatsapp`) con **`delayHours: 0`**. |
| Solo WhatsApp | Todos los pasos `channel: "whatsapp"` con `objective` claro por etapa. |

**Instagram / email** en producción: hasta que exista integración, el cron deja el intento en `queued` y el equipo ejecuta desde CRM / Meta Business según proceso interno.

---

## Pendiente (Fase 2 / producto)

- Un solo paso con `channels: string[]` y envío coordinado.
- Envío real de email transaccional desde el mismo job.
- Reglas por `commercialStage` / score (`triggers` en `FollowUpPlan`).
- Fatiga global por contacto (límite de mensajes / semana).

---

## Implementado en este documento

- Cuatro familias de planes (3, 6, 9, 12) con **objetivos explícitos** por envío.
- Estrategia de **canales paralelos** compatible con el motor actual (pasos consecutivos, `delayHours: 0`).
- Ejemplos JSON listos para adaptar en `/dashboard/account/follow-up-plans` o carga por seed.

**Bloqueado por acción manual del operador:** definir tono de marca, límites legales de contacto y consentimientos por canal en cada país/provincia; el producto no sustituye asesoría legal.
