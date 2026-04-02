# Demo simulado: 5 consultas (Avalon · Metro · Level · Innova) → Kite Prospect a 15 días

**Modo:** solo **documentación de ejemplo**. **No** se ejecuta captura, cron, WhatsApp ni email real. Los textos y nombres son **ficticios** para entrenar el relato operativo; no afirman datos reales de CRM ni de inquilinos.

**Líneas comerciales (etiquetas demo):** en este ejercicio, **Avalon**, **Metro**, **Level** e **Innova** representan **cuatro carteras o marcas** dentro del mismo tenant o cuentas demo — solo para mostrar **opciones distintas** de flujo (canal, tipo de bien, urgencia, canal de seguimiento).

**Referencia técnica:** captura (`Contact`, `Conversation`, `Message`), inbox, matching sobre `Property` del feed, `FollowUpSequence` + `processDueFollowUps` (`docs/decisions/follow-up-plans-real-estate-templates.md`, `slice-s30-follow-up-start-from-contact.md`).

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
