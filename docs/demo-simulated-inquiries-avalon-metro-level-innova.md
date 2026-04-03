# Demo simulado: 5 consultas (Avalon · Metro · Level · Innova) → Kite Prospect a 15 días

**Modo:** solo **documentación de ejemplo**. **No** se ejecuta captura, cron, WhatsApp ni email real. Los textos y nombres son **ficticios** para entrenar el relato operativo; no afirman datos reales de CRM ni de inquilinos.

**Líneas comerciales (etiquetas demo):** en este ejercicio, **Avalon**, **Metro**, **Level** e **Innova** representan **cuatro carteras o marcas** dentro del mismo tenant o cuentas demo — solo para mostrar **opciones distintas** de flujo (canal, tipo de bien, urgencia, canal de seguimiento).

**Referencia técnica:** captura (`Contact`, `Conversation`, `Message`), inbox, matching sobre `Property` del feed, `FollowUpSequence` + `processDueFollowUps` (`docs/decisions/follow-up-plans-real-estate-templates.md`, `slice-s30-follow-up-start-from-contact.md`).

### Cómo leer “asistente” vs “mensajes enviados” (demo)

| Origen | Dónde aparece en el producto | Qué es el texto |
|--------|-------------------------------|-----------------|
| **Asistente (IA inbox)** | Panel de IA en `/dashboard/inbox/[id]` tras `planNextConversationAction` | Propuesta estructurada: suele ser `kind: "reply"` con **`draftReply`** (borrador); el **humano** edita y envía por WhatsApp manual o ajusta. También puede sugerir `handoff` o `noop`. Ver `NextConversationAction` en `apps/web/src/domains/ai-orchestration/types.ts`. |
| **Seguimiento automático** | Cron `processDueFollowUps` | El **cuerpo del WhatsApp** sale del campo **`objective`** del paso en el JSON del `FollowUpPlan` (máx. ~4096 caracteres en envío). |
| **Paso email sin Resend** | Tarea en ficha | No se manda mail solo: se crea **tarea** con título/descripción; el texto “de cierre” queda en la descripción para copiar a mail o WA. |

Todo lo que sigue en **cursiva o bloques de cita** es **ficción demo**, no un envío real.

---

## Plan de seguimiento usado en la simulación (todos los casos)

Plantilla tipo **“Reactivación corta (3 pasos)”** iniciada el **día 1** tras la consulta:

| Paso | Tras ejecutar paso anterior, espera | Canal | Rol |
|------|-------------------------------------|--------|-----|
| 0 | — (primer disparo al vencer `nextAttemptAt`) | `whatsapp` | Saludo + validación |
| 1 | 24 h | `whatsapp` | Propuestas del inventario / refinamiento |
| 2 | 72 h | `email` | Cierre suave (sin Resend → **tarea** en ficha) |

**Cron demo:** en la vida real el batch puede ser **1×/día** (Vercel Hobby); aquí asumimos que los pasos **cayeron** en las ventanas indicadas para poder leer el relato al **día 15**.

---

## Resumen de los 5 casos

| # | Línea | Tipo de consulta | Canal entrante simulado | Variante a día 15 |
|---|--------|------------------|-------------------------|-------------------|
| 1 | **Avalon** | Penthouse vista al río, alto presupuesto | `whatsapp` | Lead caliente, visita coordinada (manual) |
| 2 | **Avalon** | Lote en country, permuta mencionada | `web_widget` | Sin respuesta tras paso 1 → secuencia **pausada** |
| 3 | **Metro** | Depto 2 amb cerca de subte, alquiler | `landing` | Respondió por WA → **match** + tarea visita |
| 4 | **Level** | Oficina 80 m², zona financiera | `form` | Email paso 2 → **tarea** “enviar mail manual” |
| 5 | **Innova** | Emprendimiento en pozo, 1 dorm | `whatsapp` | Objección precio → asesor toma en inbox, IA solo sugiere |

---

## Caso 1 — Avalon · Residencial premium

**Consulta (texto entrante):**  
“Hola, vi el aviso del penthouse en Puerto. ¿Sigue disponible? Necesito 4 dorm y cochera doble. Presupuesto hasta USD 450k.”

| Día | Qué hace Kite Prospect (simulado) | Qué vería un operador |
|-----|-----------------------------------|------------------------|
| **0** | Webhook/API crea `Contact` + `Conversation` (`whatsapp`) + `Message` inbound. `commercialStage` ~ exploratorio. | Inbox con hilo nuevo; badge no leído si aplica. |
| **1** | Admin inicia plan “Reactivación corta”. Primer paso WA (objetivo: confirmar disponibilidad **solo** según inventario sync; no inventar). | `FollowUpAttempt` #0 `sent` o `failed` según Meta. |
| **2** | Lead responde con franja horaria. | Mensajes en conversación; `conversationalStage` puede subir a “answered”. |
| **3** | Segundo paso WA con **1–2 propiedades** del feed que matchean (o texto pidiendo dato si no hay match). | Lista `PropertyMatch` en ficha si hubo sync previo. |
| **8** | Coordinador agenda visita **fuera de automatización** (llamada/agenda). | `Task` tipo `visit` en CRM; seguimiento auto puede **pausarse** por política. |
| **15** | Secuencia completada o pausada tras visita; score recalculado si hubo eventos. | Ficha: historial de intentos + nota “visita agendada demo”. |

**Opción distintiva:** prioridad alta → intervención humana temprana pese al flujo automático.

#### Textos demo — Caso 1

**Asistente (día ~0, primer abordaje en inbox)** — propuesta `reply` / `draftReply` *ejemplo:*

> Hola, gracias por escribirnos. Para el penthouse en Puerto necesitamos confirmar disponibilidad con el inventario que tenemos cargado (no podemos asegurar nada que no esté en sistema). ¿Podés confirmar si el presupuesto es USD 450.000 finales y si la cochera doble es excluyente? Con eso te derivo al coordinador para ver agenda de visita.

**Seguimiento automático — WhatsApp paso 0** (`objective` del plan):

> Hola, soy de Avalon. Recibimos tu consulta por el penthouse en Puerto (4 dorm, cochera doble, presupuesto hasta USD 450k). ¿Seguís con la misma búsqueda? Si querés, en el día te confirmamos qué tenemos publicado hoy en esa línea, sin inventar datos.

**Seguimiento automático — WhatsApp paso 1** (`objective`):

> Te escribimos de nuevo desde Avalon. Según lo que tenemos en cartera para tu perfil, estas son opciones reales del inventario: [ref. interna KP-XXXX / enlace si aplica]. Si ninguna encaja, decinos qué ajustarías (vista, piso, amenities) y seguimos filtrando.

**Paso 2 email** (si hubiera Resend) *o texto en **tarea** “Seguimiento email (acción manual)”*:

> Asunto: Avalon — ¿Seguimos con tu búsqueda en Puerto?  
> Cuerpo: Hola, te escribimos para cerrar el circuito automático. ¿Querés que sigamos buscando opciones o preferís que lo dejemos acá? Si ya coordinaste visita con el equipo, ignorá este mensaje.

---

## Caso 2 — Avalon · Country / permuta

**Consulta:**  
“Buenas, tengo casa en Fisherton para permutar por lote en country. ¿Tienen algo en el mismo rango?”

| Día | Simulación | Notas |
|-----|------------|--------|
| **0** | Captura desde **widget**; `channel` `web_widget`. | Origen distinto al caso 1. |
| **1** | Paso 0 WA pide fotos / tasación / rango. | Texto en `objective` sin prometer operación. |
| **4** | **Sin respuesta** del lead. Paso 1 WA reintenta. | `FollowUpAttempt` con `failed` o sin lectura. |
| **7** | Operador **pausa** secuencia desde ficha (`PATCH` follow-up-sequence). | Estado `paused`; cron no avanza. |
| **15** | Sin más toques automáticos. Tarea opcional “llamar una vez”. | Ejemplo de **fatiga** y control humano. |

**Opción distintiva:** cadena cortada + pausa explícita (no spamear).

#### Textos demo — Caso 2

**Asistente (día ~1, tras consulta widget)** — *ejemplo* `reply` / `draftReply`:

> Hola, gracias por el contacto. Las permutas las evaluamos caso por caso: si podés decirnos zona aproximada del country, metros del lote que buscás y un rango de valor de tu casa en Fisherton, lo cargamos para que un asesor te responda con propiedades reales del inventario.

**Seguimiento automático — WhatsApp paso 0:**

> Hola, somos Avalon. Vimos tu mensaje sobre permuta (casa Fisherton → lote en country). ¿Podés enviarnos 2–3 fotos o una tasación reciente y el rango de valor que manejás? Así vemos si hay algo compatible en lo que tenemos publicado.

**Seguimiento automático — WhatsApp paso 1** (reintento si no hubo respuesta):

> Te escribimos de nuevo por el tema country/permuta. Si todavía te interesa, respondé con un “sí” y te llamamos; si no, no hay problema.

*(Tras la pausa manual del operador, no se envía más automático.)*

---

## Caso 3 — Metro · Alquiler urbano

**Consulta:**  
“Busco 2 ambientes para alquilar, línea D Congreso, máximo 450 mil pesos. Entrada junio.”

| Día | Simulación | Notas |
|-----|------------|--------|
| **0** | `landing` + UTM `utm_source=metro_campaign`. | Buen ejemplo de atribución en `metadata` si lo guardan. |
| **1** | Paso 0 WA confirma moneda, garantía y fecha. | |
| **3** | Lead contesta; paso 1 con **matches** de alquiler del inventario (solo si hay `Property` alineados en feed). | Si no hay, mensaje pide criterio. |
| **10** | Asesor envía **recomendación WA** desde ficha (S20) sobre un match. | `Recommendation` + `sentAt` en match. |
| **15** | Paso 2 email → **tarea** “reenviar por mail plantilla Metro”. | Mix **automatización + manual**. |

**Opción distintiva:** canal mixto landing + WA + acción manual S20 a mitad de camino.

#### Textos demo — Caso 3

**Asistente (día ~0)** — *ejemplo* `reply` / `draftReply`:

> Hola, gracias por tu consulta desde la campaña Metro. Para alquiler 2 ambientes línea D: ¿el tope de 450.000 es pesos mensuales? ¿Necesitás factura A y garantía de alquiler? Con eso filtramos solo avisos reales del inventario.

**Seguimiento automático — WhatsApp paso 0:**

> Hola, Metro Propiedades. Recibimos tu búsqueda: 2 ambientes, zona Congreso / línea D, hasta $450.000, ingreso junio. ¿Confirmás que es pesos argentinos y si tenés garantía lista?

**Seguimiento automático — WhatsApp paso 1:**

> Te pasamos opciones que tenemos hoy en alquiler para tu perfil: [ref. KP-AAAA / KP-BBBB]. Si querés visita, decinos dos horarios entre semana.

**Recomendación manual (S20, día ~10)** — texto típico del envío WA desde ficha (no es `objective` del plan; lo arma el operador sobre el match):

> Hola, te escribo por el depto que comentamos (ref. interna). ¿Te sirve coordinar visita el jueves por la tarde?

**Tarea / mail cierre (paso 2):**

> Asunto: Metro — ¿Seguimos con tu alquiler?  
> Cuerpo: Hola, cerramos el seguimiento automático. ¿Querés que sigamos enviándote novedades de 2 ambientes en esa zona o damos por cerrado?

---

## Caso 4 — Level · Oficina comercial

**Consulta:**  
“Necesito oficina 70–90 m², Microcentro, presupuesto alquiler USD 1.200.”

| Día | Simulación | Notas |
|-----|------------|--------|
| **0** | Formulario `/lead` con `slug` cuenta demo. | Canal `form`. |
| **1–2** | Pasos WA 0 y 1 con tono **B2B** (horario visita, facturación). | Mismo motor; cambia redacción del `objective` en el plan. |
| **6** | Paso 2 **email** sin Resend configurado → `Task` “Seguimiento email (acción manual)”. | Comportamiento MVP documentado. |
| **15** | Tarea aún `pending` o marcada `completed` en demo narrativo. | Enfatiza **deuda operativa** si no hay email transaccional. |

**Opción distintiva:** dependencia de **tarea manual** en el cierre del embudo automático.

#### Textos demo — Caso 4

**Asistente (día ~0)** — *ejemplo* `reply` / `draftReply`:

> Buen día, gracias por el contacto Level. Para oficina 70–90 m² Microcentro: ¿preferís planta libre o división? ¿El presupuesto USD 1.200 es mensual más expensas? Lo registramos para cruzarlo con inventario disponible.

**Seguimiento automático — WhatsApp paso 0:**

> Hola, te escribe Level Negocios. Vimos tu consulta por oficina 70–90 m², Microcentro, alquiler USD 1.200. ¿Buscás contrato a término estándar o proyecto corto? ¿Horario preferido para una visita?

**Seguimiento automático — WhatsApp paso 1:**

> Te compartimos referencias actuales de oficinas en esa franja: [ref. inventario]. Si necesitás plantas o fotos en PDF, decinos y lo vemos con el asesor asignado.

**Tarea generada al fallar email automático** (título + descripción típicos):

- **Título:** `Seguimiento email (acción manual)`  
- **Descripción:**  
  > Enviar cierre Level al lead: confirmar si sigue buscando oficina Microcentro o si prefiere pausar. Adjuntar brochure si aplica. Texto sugerido: “Hola, te contactamos desde Level por tu consulta de oficina. ¿Seguimos con la búsqueda o cerramos por ahora?”

---

## Caso 5 — Innova · Emprendimiento / pozo

**Consulta:**  
“Quiero ver opciones de 1 dorm a estrenar en zona norte, financiación en pesos. ¿Hay unidades en pozo?”

| Día | Simulación | Notas |
|-----|------------|--------|
| **0** | WhatsApp; perfil marcado **inversión / primera vivienda** en notas. | |
| **1** | Paso 0 WA; lead pide **plan de pagos** detallado. | |
| **3** | IA asistida en **inbox** sugiere respuesta estructurada (sin mutar datos de obra sin validación). | Operador aprueba y envía. |
| **5** | Lead dice “caro vs competencia”. | No hay envío automático agresivo; **handoff** a humano. |
| **15** | Secuencia sigue activa pero pasos subsiguientes son **tono suave**; asesor negocia en hilo. | Muestra **IA + reglas**, no solo secuencia ciega. |

**Opción distintiva:** objeción + **inbox + IA** por encima del solo follow-up programado.

#### Textos demo — Caso 5

**Asistente (día ~3, lead pide plan de pagos)** — *ejemplo* `reply` / `draftReply`:

> Hola, gracias por tu interés en Innova. Los planes de pagos y valores en pesos los maneja el equipo comercial con la documentación oficial del emprendimiento; desde acá no puedo confirmar cuotas ni descuentos. Te propongo este mensaje para enviar: “Gracias, te paso con el asesor que te envía el plan de pagos oficial y disponibilidad de unidades en pozo.”

**Asistente (día ~5, objeción “muy caro”)** — *ejemplo* `handoff` (el modelo o reglas S11 pueden forzar derivación):

- **reason (ejemplo):** `lead_objection_price_competitor`  
- **summaryForHuman (ejemplo):** “Lead compara con competidor; pide mejora. No enviar descuento sin aprobación. Revisar inventario unidades restantes en pozo.”

*(El operador escribe el mensaje final; no dispara promesa de precio sin validación.)*

**Seguimiento automático — WhatsApp paso 0:**

> Hola, Innova Desarrollos. Gracias por tu consulta por unidades a estrenar 1 dorm, zona norte, financiación en pesos. ¿Seguís explorando en pozo o preferís algo listo para habitar?

**Seguimiento automático — WhatsApp paso 1:**

> Te escribimos de nuevo desde Innova. Si querés, el equipo te comparte unidades actuales del proyecto que encajan con 1 dorm y financiación en pesos (siempre según lo publicado). ¿Tenés preferencia de piso o amenities?

**Paso 2 (email o tarea):**

> Asunto: Innova — ¿Seguimos con tu consulta en pozo?  
> Cuerpo: Hola, cerramos el circuito automático de seguimiento. Si querés seguir, respondé y te asignamos asesor; si no, gracias por tu tiempo.

---

## Vista a 15 días (comparativa rápida)

| Caso | Línea | Día ~15 estado narrativo | Automación |
|------|--------|---------------------------|------------|
| 1 | Avalon | Visita agendada | Auto + humano fuerte |
| 2 | Avalon | Pausado por silencio | Auto detenido |
| 3 | Metro | Match enviado + tarea mail | Auto + S20 |
| 4 | Level | Tarea email pendiente | Auto → manual |
| 5 | Innova | Negociación humana en hilo | Auto + IA inbox |

---

## Lo que este demo **no** hace

- No llama APIs reales ni envía mensajes.
- No crea filas en tu base de datos.
- No sustituye políticas comerciales acordadas por cuenta (`Account.config`, consentimientos, opt-out).

---

## Referencias

- `docs/kiteprop-kite-prospect-flow-examples.md`
- `docs/decisions/follow-up-plans-real-estate-templates.md`
- `docs/decisions/slice-s30-follow-up-start-from-contact.md`
- `docs/decisions/kiteprop-frontera-demo-y-produccion.md`
