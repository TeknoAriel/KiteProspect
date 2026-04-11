/**
 * Conversaciones demo por canal: mismo `channel` que producción, `channelId` fijo para no mezclar con webhooks reales.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { DEMO_SIM_CHANNEL_ID, type DemoChannel } from "../demo-channel-simulation.constants";

export {
  DEMO_CHANNELS,
  DEMO_SIM_CHANNEL_ID,
  type DemoChannel,
  isDemoChannel,
} from "../demo-channel-simulation.constants";

const DEMO_CONTACT: Record<
  DemoChannel,
  { name: string; phone: string | null; email: string | null }
> = {
  whatsapp: { name: "Sim · WhatsApp", phone: "+15550000001", email: null },
  email: { name: "Sim · Email", phone: null, email: "demo-sim-email@kite.local" },
  sms: { name: "Sim · SMS", phone: "+15550000002", email: null },
  web_widget: {
    name: "Sim · Widget",
    phone: "+15550000003",
    email: "demo-sim-widget@kite.local",
  },
  form: {
    name: "Sim · Formulario",
    phone: "+15550000004",
    email: "demo-sim-form@kite.local",
  },
  landing: {
    name: "Sim · Landing",
    phone: "+15550000005",
    email: "demo-sim-landing@kite.local",
  },
  meta_lead: {
    name: "Sim · Meta Lead",
    phone: "+15550000006",
    email: "demo-sim-meta@kite.local",
  },
};

export async function getOrCreateDemoConversation(params: {
  accountId: string;
  channel: DemoChannel;
}): Promise<{ conversationId: string; contactId: string }> {
  const existing = await prisma.conversation.findFirst({
    where: {
      accountId: params.accountId,
      channel: params.channel,
      channelId: DEMO_SIM_CHANNEL_ID,
    },
    select: { id: true, contactId: true },
  });
  if (existing) {
    return { conversationId: existing.id, contactId: existing.contactId };
  }

  const seed = DEMO_CONTACT[params.channel];
  const contact = await prisma.contact.create({
    data: {
      accountId: params.accountId,
      name: seed.name,
      phone: seed.phone,
      email: seed.email,
      conversationalStage: "new",
      commercialStage: "exploratory",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      accountId: params.accountId,
      contactId: contact.id,
      channel: params.channel,
      channelId: DEMO_SIM_CHANNEL_ID,
      status: "active",
    },
  });

  return { conversationId: conversation.id, contactId: contact.id };
}

export async function appendDemoInboundMessage(params: {
  accountId: string;
  channel: DemoChannel;
  actorUserId: string | null;
  text: string;
}): Promise<
  | { ok: true; conversationId: string; contactId: string }
  | { ok: false; error: string }
> {
  const text = params.text.trim();
  if (!text) {
    return { ok: false, error: "Mensaje vacío." };
  }

  const { conversationId, contactId } = await getOrCreateDemoConversation({
    accountId: params.accountId,
    channel: params.channel,
  });

  const conv = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      accountId: params.accountId,
      channelId: DEMO_SIM_CHANNEL_ID,
    },
    include: { contact: true },
  });
  if (!conv) {
    return { ok: false, error: "Conversación demo no encontrada." };
  }

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "inbound",
      content: text,
      channel: conv.channel,
    },
  });

  if (conv.contact.conversationalStage === "new") {
    await prisma.contact.update({
      where: { id: conv.contactId },
      data: { conversationalStage: "answered" },
    });
  }

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  await recordAuditEvent({
    accountId: params.accountId,
    entityType: "conversation",
    entityId: conv.id,
    action: "demo_sim_inbound",
    actorId: params.actorUserId ?? undefined,
    actorType: "user",
    metadata: { channel: conv.channel, length: text.length },
  });

  return { ok: true, conversationId, contactId };
}

export async function appendDemoOutboundMessage(params: {
  accountId: string;
  conversationId: string;
  actorUserId: string | null;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = params.text.trim();
  if (!text) {
    return { ok: false, error: "Mensaje vacío." };
  }

  const conv = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      accountId: params.accountId,
      channelId: DEMO_SIM_CHANNEL_ID,
    },
  });
  if (!conv) {
    return { ok: false, error: "Conversación demo no encontrada." };
  }

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "outbound",
      content: text,
      channel: conv.channel,
    },
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });

  await recordAuditEvent({
    accountId: params.accountId,
    entityType: "conversation",
    entityId: conv.id,
    action: "demo_sim_outbound",
    actorId: params.actorUserId ?? undefined,
    actorType: "user",
    metadata: { channel: conv.channel, length: text.length },
  });

  return { ok: true };
}
