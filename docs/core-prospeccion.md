# Núcleo de prospección inmobiliaria asistida

**Fuente de alineación:** `PRODUCT_DEFINITION.md`, este documento, `docs/seguimiento-y-cualificacion.md`.

## Qué es (y qué no es)

Kite Prospect es una **plataforma de prospección inmobiliaria asistida**: capa de captación, activación, conversación, cualificación, seguimiento, reactivación, sugerencia de propiedades y derivación al CRM principal.

- **No** es un CRM 100 % ni un portal inmobiliario genérico.
- **No** es un chatbot de FAQ ni un inbox desnudo: el valor está en **pre-calificar**, **ordenar** y **madurar** el lead antes del CRM fuerte.

## Objetivo del asistente (más allá de “responder”)

1. Activar leads entrantes.  
2. Sostener la conversación con reglas comerciales.  
3. Obtener información comercial relevante (sin inventar propiedades).  
4. Detectar intención, urgencia, viabilidad y bloqueos.  
5. Construir un perfil de búsqueda útil (declarado + inferido + comportamiento progresivo).  
6. Sugerir propiedades del inventario real con buen orden y límites por fase.  
7. Decidir continuar, pausar, reactivar o derivar.

Comportamiento objetivo: **pre-calificador y reactivador comercial omnicanal** que prepara la oportunidad para KiteProp u otro CRM.

## Posicionamiento comercial

- Puede operar **sola** (modo liviano: CRM nativo mínimo del producto).  
- Puede **complementar a KiteProp** (partner principal de inventario/links cuando el feed/API lo permita).  
- Puede **integrarse** con otros CRMs externos (Fase 3+).  
- La monetización futura se apoya en **planes, límites y capacidades** (ver `docs/monetizacion-base.md`).

## Núcleo lógico (resumen)

| Dimensión | Definición |
|-----------|------------|
| **4 intensidades** | `soft`, `normal`, `strong`, `priority` — estrategia + tope sugerido de contactos (4 / 6 / 8 / 10). Código: `follow-up-intensity.ts`. |
| **Matrices por intensidad** | Pasos oficiales y textos por paso: `follow-up-official-matrix.ts` (ver `docs/seguimiento-y-cualificacion.md`). |
| **6 etapas de seguimiento** | Activación → Enfoque → Cualificación → Afinado → Conversión → Reactivación. Claves: `activation`, `focus`, `qualification`, `refinement`, `conversion`, `reactivation`. |
| **6 ramas mínimas** | Sin respuesta, responde poco, responde bien, lead bloqueado, match alto, sin match ahora. Claves: `follow-up-branches.ts`. |

## Sugerencia de propiedades

- Fases tempranas: hasta **3** sugerencias visibles; con match fuerte o lead preparado: hasta **5** (constante `PROPERTY_MATCHES_UI_LIMIT` en ficha contacto).  
- Siempre desde tabla `Property` del tenant (nunca inventar).  
- Origen de **URLs/fichas**: ver `docs/integracion-kiteprop-propieya.md`.

## Referencias cruzadas

- Estados y etiquetas (incl. vista unificada): `docs/estados-y-etiquetas.md`.  
- Seguimiento y cualificación: `docs/seguimiento-y-cualificacion.md`.  
- Brecha vs código actual: `docs/diferencias-vs-implementacion-actual.md`.
