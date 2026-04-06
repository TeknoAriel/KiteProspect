/**
 * Datos demo enriquecidos: ~10 consultas variadas (canales + respuestas), inventario,
 * y planes de seguimiento alineados a la matriz oficial (4 intensidades).
 * Objetivos de paso: mantener alineados con `apps/web/.../follow-up-official-matrix.ts`.
 * Idempotente: si existe el contacto marcador, no hace nada.
 */
import type { Prisma, PrismaClient } from "@prisma/client";

type DemoIntensity = "soft" | "normal" | "strong" | "priority";

function demoSequenceFromObjectives(
  objectives: readonly string[],
  channels: string[],
  delayHours: number,
): Array<{ step: number; delayHours: number; channel: string; objective: string }> {
  return objectives.map((objective, i) => ({
    step: i,
    delayHours: i === 0 ? 0 : delayHours,
    channel: channels[i % channels.length] ?? "email",
    objective,
  }));
}

export const DEMO_SHOWCASE_MARKER_EMAIL = "lead01@demo-showcase.local";

type ShowcaseProperty = {
  title: string;
  description: string;
  type: string;
  intent: "venta" | "renta";
  zone: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
};

type ShowcaseLead = {
  name: string;
  email: string;
  phone: string;
  channel: "form" | "whatsapp" | "web_widget" | "landing";
  inbound: string;
  /** Respuesta simulada del equipo (canal distinto al de entrada en varios casos). */
  outbound: { content: string; channel: string };
  profile: {
    intent: string | null;
    propertyType: string | null;
    zone: string | null;
    maxPrice: number | null;
    minPrice?: number | null;
    bedrooms: number | null;
    extra?: Record<string, unknown>;
  };
  commercialStage: string;
  conversationalStage: string;
  scores: { intent: number; readiness: number; fit: number; engagement: number };
};

const PROPERTIES: ShowcaseProperty[] = [
  {
    title: "[Demo] Depto 2 amb — Palermo",
    description: "Luminoso, contrafrente, amenities.",
    type: "departamento",
    intent: "venta",
    zone: "Palermo",
    price: 185000,
    bedrooms: 2,
    bathrooms: 1,
  },
  {
    title: "[Demo] Casa 4 dorm — Belgrano",
    description: "Patio, cochera cubierta, 2 plantas.",
    type: "casa",
    intent: "venta",
    zone: "Belgrano",
    price: 520000,
    bedrooms: 4,
    bathrooms: 3,
  },
  {
    title: "[Demo] Monoambiente división — Centro",
    description: "Ideal renta temporaria / inversión.",
    type: "departamento",
    intent: "venta",
    zone: "Centro",
    price: 95000,
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    title: "[Demo] Casa alquiler temporario — Nordelta",
    description: "Amoblada, pileta, disponible temporada.",
    type: "casa",
    intent: "renta",
    zone: "Nordelta",
    price: 2500,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    title: "[Demo] Terreno Escobar — Barrio cerrado",
    description: "Lote 800 m², servicios.",
    type: "terreno",
    intent: "venta",
    zone: "Escobar",
    price: 85000,
    bedrooms: null,
    bathrooms: null,
  },
  {
    title: "[Demo] PH 3 amb — Caballito",
    description: "Sin expensas, terraza propia.",
    type: "departamento",
    intent: "venta",
    zone: "Caballito",
    price: 142000,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    title: "[Demo] Oficina — Microcentro (uso profesional)",
    description: "Piso alto, seguridad 24 h.",
    type: "departamento",
    intent: "venta",
    zone: "Microcentro",
    price: 98000,
    bedrooms: null,
    bathrooms: 1,
  },
  {
    title: "[Demo] Dúplex — Martínez",
    description: "Jardín, cochera doble.",
    type: "casa",
    intent: "venta",
    zone: "Martínez",
    price: 380000,
    bedrooms: 4,
    bathrooms: 3,
  },
  {
    title: "[Demo] Local comercial — Avellaneda",
    description: "Vidriera, 120 m² cubiertos.",
    type: "departamento",
    intent: "venta",
    zone: "Avellaneda",
    price: 165000,
    bedrooms: null,
    bathrooms: 1,
  },
  {
    title: "[Demo] Cochera + baulera — Recoleta",
    description: "Edificio categoría, subsuelo.",
    type: "departamento",
    intent: "venta",
    zone: "Recoleta",
    price: 28000,
    bedrooms: null,
    bathrooms: null,
  },
];

const LEADS: ShowcaseLead[] = [
  {
    name: "Ana López",
    email: "lead01@demo-showcase.local",
    phone: "+5491110000001",
    channel: "form",
    inbound:
      "Hola, busco departamento de 2 ambientes en Palermo, venta, presupuesto hasta 200 mil USD. ¿Tienen visitas esta semana?",
    outbound: {
      content:
        "Hola Ana, gracias por el contacto desde el formulario. Te paso opciones del inventario y coordinamos visita con un asesor.",
      channel: "web",
    },
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Palermo",
      maxPrice: 200000,
      bedrooms: 2,
    },
    commercialStage: "prospect",
    conversationalStage: "answered",
    scores: { intent: 72, readiness: 55, fit: 68, engagement: 48 },
  },
  {
    name: "Bruno Méndez",
    email: "lead02@demo-showcase.local",
    phone: "+5491110000002",
    channel: "whatsapp",
    inbound:
      "Buenas, necesito casa 4 dormitorios en Belgrano con cochera. Es para mudanza familiar. Presupuesto flexible si la propiedad cierra.",
    outbound: {
      content:
        "Hola Bruno, recibimos tu mensaje por WhatsApp. Te enviamos el listado filtrado y un video del barrio.",
      channel: "whatsapp",
    },
    profile: {
      intent: "compra",
      propertyType: "casa",
      zone: "Belgrano",
      maxPrice: 600000,
      bedrooms: 4,
    },
    commercialStage: "real_lead",
    conversationalStage: "profiled_partial",
    scores: { intent: 80, readiness: 62, fit: 74, engagement: 70 },
  },
  {
    name: "Carla Ruiz",
    email: "lead03@demo-showcase.local",
    phone: "+5491110000003",
    channel: "web_widget",
    inbound:
      "Interesada en monoambiente para inversión en CABA. Prioridad liquidez y alquiler temporario futuro.",
    outbound: {
      content:
        "Hola Carla, desde el widget dejaste tu consulta. Te compartimos por email el pack de renta potencial y gastos.",
      channel: "web",
    },
    profile: {
      intent: "inversión",
      propertyType: "departamento",
      zone: "Centro",
      maxPrice: 110000,
      bedrooms: 1,
      extra: { objetivo: "inversión" },
    },
    commercialStage: "prospect",
    conversationalStage: "answered",
    scores: { intent: 58, readiness: 44, fit: 61, engagement: 40 },
  },
  {
    name: "Diego Ferreira",
    email: "lead04@demo-showcase.local",
    phone: "+5491110000004",
    channel: "landing",
    inbound:
      "Consulta por alquiler temporario en Nordelta, febrero, 2 semanas, 3 dormitorios. Somos familia con dos niños.",
    outbound: {
      content:
        "Hola Diego, recibimos la landing. Te mandamos disponibilidad y condiciones por WhatsApp para cerrar fechas.",
      channel: "whatsapp",
    },
    profile: {
      intent: "renta",
      propertyType: "casa",
      zone: "Nordelta",
      maxPrice: 4000,
      bedrooms: 3,
    },
    commercialStage: "hot",
    conversationalStage: "profiled_useful",
    scores: { intent: 76, readiness: 68, fit: 82, engagement: 55 },
  },
  {
    name: "Elena Costa",
    email: "lead05@demo-showcase.local",
    phone: "+5491110000005",
    channel: "form",
    inbound:
      "Busco terreno en Escobar en barrio cerrado, al menos 700 m², para construcción a medida. Financiación posible.",
    outbound: {
      content:
        "Hola Elena, te respondemos por el formulario con mapa de lotes y normativa de FOT en la zona.",
      channel: "web",
    },
    profile: {
      intent: "compra",
      propertyType: "terreno",
      zone: "Escobar",
      maxPrice: 120000,
      bedrooms: null,
    },
    commercialStage: "exploratory",
    conversationalStage: "answered",
    scores: { intent: 45, readiness: 38, fit: 52, engagement: 35 },
  },
  {
    name: "Federico Paz",
    email: "lead06@demo-showcase.local",
    phone: "+5491110000006",
    channel: "whatsapp",
    inbound:
      "PH sin expensas en Caballito, 3 ambientes, que no sea interno. Presupuesto hasta 150 mil USD.",
    outbound: {
      content:
        "Hola Federico, te enviamos por WA fotos y llave para visita. También te dejamos resumen por email.",
      channel: "whatsapp",
    },
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Caballito",
      maxPrice: 150000,
      bedrooms: 3,
      extra: { sinExpensas: true },
    },
    commercialStage: "prospect",
    conversationalStage: "identified",
    scores: { intent: 66, readiness: 50, fit: 71, engagement: 62 },
  },
  {
    name: "Gisela Núñez",
    email: "lead07@demo-showcase.local",
    phone: "+5491110000007",
    channel: "web_widget",
    inbound:
      "Oficina en microcentro, planta de al menos 40 m², para estudio contable. Compra o alquiler según números.",
    outbound: {
      content:
        "Hola Gisela, desde el chat del sitio: te mandamos comparativo compra vs alquiler en PDF.",
      channel: "web",
    },
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Microcentro",
      maxPrice: 120000,
      bedrooms: null,
    },
    commercialStage: "prospect",
    conversationalStage: "answered",
    scores: { intent: 52, readiness: 41, fit: 58, engagement: 42 },
  },
  {
    name: "Hugo Salas",
    email: "lead08@demo-showcase.local",
    phone: "+5491110000008",
    channel: "form",
    inbound:
      "Dúplex zona norte, 4 ambientes, jardín. Familia con perro mediano. ¿Zonas con más oferta?",
    outbound: {
      content:
        "Hugo, gracias por el detalle. Respondemos por formulario con barrios y colegios cercanos.",
      channel: "web",
    },
    profile: {
      intent: "compra",
      propertyType: "casa",
      zone: "Martínez",
      maxPrice: 420000,
      bedrooms: 4,
    },
    commercialStage: "real_lead",
    conversationalStage: "profiled_partial",
    scores: { intent: 70, readiness: 58, fit: 69, engagement: 48 },
  },
  {
    name: "Inés Vidal",
    email: "lead09@demo-showcase.local",
    phone: "+5491110000009",
    channel: "landing",
    inbound:
      "Local en avenida con vidriera, zona sur, inversión. Necesito estimación de canon y gastos.",
    outbound: {
      content:
        "Inés, landing recibida. Te contactamos por email con tres fichas y proyección de retorno.",
      channel: "web",
    },
    profile: {
      intent: "inversión",
      propertyType: "departamento",
      zone: "Avellaneda",
      maxPrice: 200000,
      bedrooms: null,
    },
    commercialStage: "exploratory",
    conversationalStage: "answered",
    scores: { intent: 48, readiness: 42, fit: 55, engagement: 38 },
  },
  {
    name: "Javier Coria",
    email: "lead10@demo-showcase.local",
    phone: "+5491110000010",
    channel: "whatsapp",
    inbound:
      "Cochera fija más baulera en Recoleta, edificio con acceso directo. Urgente por mudanza.",
    outbound: {
      content:
        "Javier, te confirmamos disponibilidad por WhatsApp y enviamos planos del subsuelo.",
      channel: "whatsapp",
    },
    profile: {
      intent: "compra",
      propertyType: "departamento",
      zone: "Recoleta",
      maxPrice: 35000,
      bedrooms: null,
    },
    commercialStage: "hot",
    conversationalStage: "answered",
    scores: { intent: 62, readiness: 72, fit: 64, engagement: 66 },
  },
];

/** Objetivos por paso (matriz oficial). */
const OBJ_SOFT = [
  "Activación: confirmar interés",
  "Enfoque: operación y tipo de propiedad",
  "Cualificación ligera: zona o rango",
  "Reactivación o cierre: perfil guardado o subir a Normal",
] as const;

const OBJ_NORMAL = [
  "Activación: confirmar interés",
  "Enfoque: operación, tipo, propiedad puntual o búsqueda abierta",
  "Enfoque: zona ideal y zona aceptable",
  "Cualificación: rango de inversión",
  "Cualificación: timing y bloqueos",
  "Conversión o seguimiento: asesor, opciones, seguir viendo",
] as const;

const OBJ_STRONG = [
  "Activación: confirmar continuidad",
  "Enfoque: operación, tipo y zona",
  "Cualificación: presupuesto",
  "Cualificación: timing",
  "Cualificación: bloqueos",
  "Afinado: flexibilidad, zona, alternativas",
  "Conversión: llamada, visita, asesor o ficha",
  "Reactivación inteligente: opción nueva o perfil afinado",
] as const;

const OBJ_PRIORITY = [
  "Activación inmediata",
  "Enfoque exacto",
  "Presupuesto real",
  "Timing real",
  "Bloqueo real",
  "Afinado",
  "Mostrar opciones concretas",
  "Acción humana",
  "Reactivación inteligente",
  "Cierre operativo",
] as const;

/** 8 planes: 2 por intensidad (matriz completa por plan). */
const FOLLOW_UP_PLANS: Array<{
  name: string;
  description: string;
  intensity: DemoIntensity;
  maxAttempts: number;
  sequence: Array<{ step: number; delayHours: number; channel: string; objective: string }>;
}> = [
  {
    name: "Demo · Suave A (email + WA)",
    description: "4 pasos matriz Suave; alternancia email / WhatsApp.",
    intensity: "soft",
    maxAttempts: 4,
    sequence: demoSequenceFromObjectives(OBJ_SOFT, ["email", "whatsapp", "email", "whatsapp"], 48),
  },
  {
    name: "Demo · Suave B (WA + Instagram manual)",
    description: "4 pasos matriz Suave; refuerzo manual en red social.",
    intensity: "soft",
    maxAttempts: 4,
    sequence: demoSequenceFromObjectives(OBJ_SOFT, ["whatsapp", "email", "instagram", "whatsapp"], 72),
  },
  {
    name: "Demo · Normal A (email ↔ WA)",
    description: "6 pasos matriz Normal.",
    intensity: "normal",
    maxAttempts: 6,
    sequence: demoSequenceFromObjectives(OBJ_NORMAL, ["email", "whatsapp", "email", "whatsapp", "email", "whatsapp"], 36),
  },
  {
    name: "Demo · Normal B (WA primero)",
    description: "6 pasos matriz Normal; ritmo conversacional.",
    intensity: "normal",
    maxAttempts: 6,
    sequence: demoSequenceFromObjectives(OBJ_NORMAL, ["whatsapp", "email", "whatsapp", "email", "whatsapp", "email"], 24),
  },
  {
    name: "Demo · Fuerte A (rápido)",
    description: "8 pasos matriz Fuerte; ideal con señal de interés.",
    intensity: "strong",
    maxAttempts: 8,
    sequence: demoSequenceFromObjectives(OBJ_STRONG, ["whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email"], 12),
  },
  {
    name: "Demo · Fuerte B (mix)",
    description: "8 pasos matriz Fuerte; email de respaldo.",
    intensity: "strong",
    maxAttempts: 8,
    sequence: demoSequenceFromObjectives(OBJ_STRONG, ["email", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp"], 18),
  },
  {
    name: "Demo · Prioritario A (horas)",
    description: "10 pasos matriz Prioritario; cadencia corta.",
    intensity: "priority",
    maxAttempts: 10,
    sequence: demoSequenceFromObjectives(OBJ_PRIORITY, ["whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email"], 4),
  },
  {
    name: "Demo · Prioritario B (WA-heavy)",
    description: "10 pasos matriz Prioritario; prioridad WhatsApp.",
    intensity: "priority",
    maxAttempts: 10,
    sequence: demoSequenceFromObjectives(OBJ_PRIORITY, ["whatsapp", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp", "email", "whatsapp"], 3),
  },
];

/** Índice de plan (0..7) asignado a cada lead por posición. */
const PLAN_INDEX_BY_LEAD: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1];

/** Empareja contacto i con propiedad i (match principal). */
function totalScore(s: ShowcaseLead["scores"]): number {
  return Math.round((s.intent + s.readiness + s.fit + s.engagement) / 4);
}

export async function ensureDemoShowcase(prisma: PrismaClient, accountId: string, advisorId: string): Promise<void> {
  const marker = await prisma.contact.findFirst({
    where: { accountId, email: { equals: DEMO_SHOWCASE_MARKER_EMAIL, mode: "insensitive" } },
    select: { id: true },
  });
  if (marker) {
    return;
  }

  const in30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(
    async (tx) => {
    const propertyRows = await Promise.all(
      PROPERTIES.map((p) =>
        tx.property.create({
          data: {
            accountId,
            title: p.title,
            description: p.description,
            type: p.type,
            intent: p.intent,
            zone: p.zone,
            price: p.price,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            status: "available",
            metadata: { demoShowcase: true },
          },
        }),
      ),
    );

    const plans: { id: string }[] = [];
    for (const def of FOLLOW_UP_PLANS) {
      const existing = await tx.followUpPlan.findFirst({
        where: { accountId, name: def.name },
      });
      if (existing) {
        plans.push({ id: existing.id });
      } else {
        const created = await tx.followUpPlan.create({
          data: {
            accountId,
            name: def.name,
            description: def.description,
            intensity: def.intensity,
            maxAttempts: def.maxAttempts,
            sequence: def.sequence,
            status: "active",
          },
        });
        plans.push({ id: created.id });
      }
    }

    for (let i = 0; i < LEADS.length; i++) {
      const lead = LEADS[i];
      const prop = propertyRows[i];
      const planId = plans[PLAN_INDEX_BY_LEAD[i]]!.id;

      const contact = await tx.contact.create({
        data: {
          accountId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          conversationalStage: lead.conversationalStage,
          commercialStage: lead.commercialStage,
        },
      });

      const conv = await tx.conversation.create({
        data: {
          accountId,
          contactId: contact.id,
          channel: lead.channel,
          channelId: lead.channel === "whatsapp" ? `wa-demo-${i + 1}` : null,
          status: "active",
        },
      });

      await tx.message.create({
        data: {
          conversationId: conv.id,
          direction: "inbound",
          content: lead.inbound,
          channel: lead.channel === "whatsapp" ? "whatsapp" : "web",
        },
      });

      await tx.message.create({
        data: {
          conversationId: conv.id,
          direction: "outbound",
          content: lead.outbound.content,
          channel: lead.outbound.channel,
          status: "sent",
        },
      });

      await tx.searchProfile.create({
        data: {
          contactId: contact.id,
          intent: lead.profile.intent,
          propertyType: lead.profile.propertyType,
          zone: lead.profile.zone,
          maxPrice: lead.profile.maxPrice,
          minPrice: lead.profile.minPrice ?? null,
          bedrooms: lead.profile.bedrooms,
          ...(lead.profile.extra != null
            ? { extra: lead.profile.extra as Prisma.InputJsonValue }
            : {}),
          source: "declared",
        },
      });

      const t = totalScore(lead.scores);
      await tx.leadScore.create({
        data: {
          contactId: contact.id,
          intentScore: lead.scores.intent,
          readinessScore: lead.scores.readiness,
          fitScore: lead.scores.fit,
          engagementScore: lead.scores.engagement,
          totalScore: t,
          version: 1,
        },
      });

      await tx.followUpSequence.create({
        data: {
          contactId: contact.id,
          followUpPlanId: planId,
          status: "active",
          currentStep: 0,
          attempts: 0,
          nextAttemptAt: in30d,
        },
      });

      await tx.assignment.create({
        data: {
          contactId: contact.id,
          advisorId,
          status: "active",
          reason: "demo_showcase",
        },
      });

      await tx.propertyMatch.create({
        data: {
          contactId: contact.id,
          propertyId: prop.id,
          score: 65 + (i % 25),
          reason: "Coincidencia demo: perfil declarado alineado con inventario [Demo].",
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        accountId,
        entityType: "account",
        entityId: accountId,
        action: "demo_showcase_seeded",
        actorType: "system",
        metadata: { source: "seed-demo-showcase.ts", contacts: LEADS.length, properties: PROPERTIES.length },
      },
    });
  },
    { maxWait: 15000, timeout: 120000 },
  );

  console.log(
    `Demo showcase: ${LEADS.length} contactos, ${PROPERTIES.length} propiedades, ${FOLLOW_UP_PLANS.length} planes de seguimiento.`,
  );
}
