/**
 * 20 escenarios fijos para laboratorio de tester (IA + reglas S11).
 * No sustituyen pruebas E2E con proveedores externos.
 */

export type ScenarioTurn = {
  inbound: string;
  /** Etiqueta tipo “día” o fase para el reporte */
  label: string;
};

export type ConversationScenario = {
  key: string;
  title: string;
  /** Canal de la conversación (mismo string que producción) */
  channel: string;
  /** Descripción corta del objetivo del caso */
  intent: string;
  turns: ScenarioTurn[];
};

export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    key: "s01",
    title: "Consulta estándar 2 ambientes",
    channel: "whatsapp",
    intent: "Lead razonable con zona y presupuesto",
    turns: [
      {
        label: "Día 0 · primera consulta",
        inbound:
          "Hola, busco un 2 ambientes en Palermo, presupuesto hasta 180k USD. ¿Tienen algo disponible?",
      },
      {
        label: "Día 2 · aclaración",
        inbound:
          "Preferencia piso alto y con balcón. Puedo visitar el viernes por la tarde.",
      },
    ],
  },
  {
    key: "s02",
    title: "Presupuesto bajo vs zona cara",
    channel: "whatsapp",
    intent: "Tensión precio–zona; ver si el sistema pide flexibilizar sin inventar",
    turns: [
      {
        label: "Día 0",
        inbound: "Quiero un monoambiente en Puerto Madero, máximo 40 mil pesos por mes.",
      },
      {
        label: "Día 1",
        inbound: "No puedo subir el presupuesto. ¿Hay algo o no?",
      },
    ],
  },
  {
    key: "s03",
    title: "Palabras sensibles (handoff)",
    channel: "email",
    intent: "Disparar regla determinística de legal/reclamo",
    turns: [
      {
        label: "Día 0",
        inbound:
          "Buenos días, estoy evaluando comprar. Tengo una consulta sobre la escritura.",
      },
      {
        label: "Día 1",
        inbound:
          "Ya hablé con mi abogado y preparo una demanda ante defensa del consumidor por publicidad engañosa del aviso.",
      },
    ],
  },
  {
    key: "s04",
    title: "Pedido explícito de humano",
    channel: "whatsapp",
    intent: "Regla explícita de derivación",
    turns: [
      {
        label: "Día 0",
        inbound: "Hola, busco casa en zona norte.",
      },
      {
        label: "Día 0 · mismo turno",
        inbound:
          "Quiero hablar con un asesor humano, no con un bot. Pasame con una persona.",
      },
    ],
  },
  {
    key: "s05",
    title: "Mensaje muy vago",
    channel: "web_widget",
    intent: "Poco contexto; ver noop o pedido de datos",
    turns: [
      { label: "Día 0", inbound: "Hola" },
      { label: "Día 1", inbound: "?" },
    ],
  },
  {
    key: "s06",
    title: "Estilo meta lead corto",
    channel: "meta_lead",
    intent: "Texto corto tipo captura",
    turns: [
      { label: "Día 0", inbound: "Depto 3 amb CABA" },
      { label: "Día 1", inbound: "Mando teléfono: 11-2345-6789" },
    ],
  },
  {
    key: "s07",
    title: "Email formal largo",
    channel: "email",
    intent: "Varios párrafos; ver resumen y reply",
    turns: [
      {
        label: "Día 0",
        inbound:
          "Estimados,\nSomos una familia de cuatro integrantes. Buscamos vivienda en condominio cerrado con seguridad 24h. Presupuesto acotado. Necesitamos saber documentación y financiación.\nSaludos cordiales.",
      },
      {
        label: "Día 3",
        inbound:
          "Adjunto no puedo enviar desde aquí. ¿Pueden enviarme PDF de condiciones?",
      },
    ],
  },
  {
    key: "s08",
    title: "SMS corto",
    channel: "sms",
    intent: "Mensajes breves",
    turns: [
      { label: "Día 0", inbound: "Hola, vi aviso. Sigo interesado." },
      { label: "Día 2", inbound: "Precio final?" },
    ],
  },
  {
    key: "s09",
    title: "Consulta absurda",
    channel: "whatsapp",
    intent: "Lead pide algo fuera de inventario típico",
    turns: [
      {
        label: "Día 0",
        inbound: "Necesito un castillo con foso en CABA, presupuesto 5000 USD.",
      },
      {
        label: "Día 1",
        inbound: "Si no tienen castillo, un penthouse con helipuerto privado.",
      },
    ],
  },
  {
    key: "s10",
    title: "Posible spam / promos",
    channel: "whatsapp",
    intent: "Lenguaje tipo oferta masiva",
    turns: [
      {
        label: "Día 0",
        inbound: "Ganá un iPhone. Hacé clic acá y completá la encuesta.",
      },
      {
        label: "Día 0 · seguimiento",
        inbound: "Última chance!!! Oferta 24hs!!!",
      },
    ],
  },
  {
    key: "s11",
    title: "Muchas preguntas en un mensaje",
    channel: "whatsapp",
    intent: "Sobrecarga de intenciones",
    turns: [
      {
        label: "Día 0",
        inbound:
          "Hola, precio, expensas, orientación, año construcción, cochera, luminosidad, vecinos ruidosos, mascotas, permuta, financiación, comisión, visita hoy.",
      },
      {
        label: "Día 1",
        inbound: "¿Y el estado de la cocina y si el agua es caliente?",
      },
    ],
  },
  {
    key: "s12",
    title: "Objeción por precio",
    channel: "whatsapp",
    intent: "Negociación",
    turns: [
      {
        label: "Día 0",
        inbound: "Me interesa el de Av. Corrientes 1234 pero me parece caro.",
      },
      {
        label: "Día 1",
        inbound: "Si no bajan 15% no sigo. Tengo otra opción en otro portal.",
      },
    ],
  },
  {
    key: "s13",
    title: "Urgencia forzada",
    channel: "whatsapp",
    intent: "Presión temporal",
    turns: [
      {
        label: "Día 0",
        inbound: "Necesito cerrar compra HOY antes de las 18hs o pierdo el préstamo.",
      },
      {
        label: "Día 0 · mismo día",
        inbound: "¿Me confirman si ya mandaron el contrato o no?",
      },
    ],
  },
  {
    key: "s14",
    title: "Mezcla idioma",
    channel: "whatsapp",
    intent: "Ruido lingüístico",
    turns: [
      {
        label: "Día 0",
        inbound: "Hi, busco 2 bed apartment in Belgrano, presupuesto 200k, thanks.",
      },
      {
        label: "Día 1",
        inbound: "Perdón, hablo español mejor. ¿Tienen visita?",
      },
    ],
  },
  {
    key: "s15",
    title: "Estilo WhatsApp con emojis",
    channel: "whatsapp",
    intent: "Tono informal",
    turns: [
      {
        label: "Día 0",
        inbound: "Holaa 👋 vi el depto en IG 😍 me encantó el balcón",
      },
      {
        label: "Día 2",
        inbound: "Pasame fotos y precio final 🙏",
      },
    ],
  },
  {
    key: "s16",
    title: "No quiere más contacto",
    channel: "whatsapp",
    intent: "Opt-out / cierre",
    turns: [
      {
        label: "Día 0",
        inbound: "Hola, busco alquiler en Caballito.",
      },
      {
        label: "Día 1",
        inbound: "No me escriban más, ya no me interesa. Gracias.",
      },
    ],
  },
  {
    key: "s17",
    title: "Pide visita inmediata",
    channel: "whatsapp",
    intent: "Alta intención concreta",
    turns: [
      {
        label: "Día 0",
        inbound: "Quiero visitar hoy mismo la propiedad de la calle X 500.",
      },
      {
        label: "Día 0",
        inbound: "Tengo la llave de un depósito en el banco para señar. ¿A qué hora?",
      },
    ],
  },
  {
    key: "s18",
    title: "Comparación con competencia",
    channel: "email",
    intent: "Menciona otro portal / inmobiliaria",
    turns: [
      {
        label: "Día 0",
        inbound:
          "Vi el mismo aviso más barato en otro sitio. ¿Pueden igualar o explicar la diferencia?",
      },
      {
        label: "Día 2",
        inbound: "Si no tienen explicación, sigo con la otra oferta.",
      },
    ],
  },
  {
    key: "s19",
    title: "Lead frío",
    channel: "form",
    intent: "Cierre educado",
    turns: [
      {
        label: "Día 0",
        inbound: "Consulté por una casa en zona sur.",
      },
      {
        label: "Día 1",
        inbound: "Gracias, ya compré con otro estudio. No necesito más contacto.",
      },
    ],
  },
  {
    key: "s20",
    title: "Zona inventada / ambigua",
    channel: "landing",
    intent: "Datos geográficos dudosos",
    turns: [
      {
        label: "Día 0",
        inbound: "Busco algo en el barrio de las Nubes Doradas cerca del río invisible.",
      },
      {
        label: "Día 1",
        inbound: "¿Existe ese barrio o me confundí de ciudad?",
      },
    ],
  },
];

export function getScenarioByKey(key: string): ConversationScenario | undefined {
  return CONVERSATION_SCENARIOS.find((s) => s.key === key);
}
