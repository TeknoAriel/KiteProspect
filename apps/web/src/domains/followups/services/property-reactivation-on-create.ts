/**
 * F2-E4: al crear una propiedad disponible, notifica oportunidades de reenganche
 * para contactos con secuencia activa en planes con `reactivateOnNewProperties`.
 * Respeta consentimiento (whatsapp o email) y fatiga (sin tarea similar reciente).
 */
import { prisma } from "@kite-prospect/db";
import { selectPreferredSearchProfile } from "@/domains/crm-leads/search-profile-preference";
import { MIN_PROPERTY_MATCH_SCORE } from "@/domains/matching/matching-score-thresholds";
import { scorePropertyAgainstProfile } from "@/domains/matching/services/score-property-match";
import { extractMatchingWeightsFromAccountConfig } from "@/domains/auth-tenancy/account-matching-config";
import { logStructured } from "@/lib/structured-log";

const REACTIVATION_TITLE_PREFIX = "[Reactivación] ";
const FATIGUE_MS = 7 * 24 * 60 * 60 * 1000;

function hasFollowUpConsent(grantedChannels: { channel: string; granted: boolean }[]): boolean {
  return grantedChannels.some(
    (c) =>
      c.granted &&
      (c.channel.toLowerCase() === "whatsapp" || c.channel.toLowerCase() === "email"),
  );
}

export type ReactivationOnNewPropertyResult = {
  tasksCreated: number;
  contactsConsidered: number;
};

export async function processReactivationForNewProperty(params: {
  accountId: string;
  propertyId: string;
}): Promise<ReactivationOnNewPropertyResult> {
  const property = await prisma.property.findFirst({
    where: { id: params.propertyId, accountId: params.accountId },
  });
  if (!property || property.status !== "available") {
    return { tasksCreated: 0, contactsConsidered: 0 };
  }

  const account = await prisma.account.findFirst({
    where: { id: params.accountId },
    select: { config: true },
  });
  const weights = extractMatchingWeightsFromAccountConfig(account?.config);

  const plans = await prisma.followUpPlan.findMany({
    where: {
      accountId: params.accountId,
      status: "active",
      reactivateOnNewProperties: true,
    },
    select: { id: true },
  });
  if (plans.length === 0) {
    return { tasksCreated: 0, contactsConsidered: 0 };
  }

  const planIds = plans.map((p) => p.id);

  const sequences = await prisma.followUpSequence.findMany({
    where: {
      status: "active",
      followUpPlanId: { in: planIds },
    },
    include: {
      contact: {
        include: {
          searchProfiles: { orderBy: { updatedAt: "desc" } },
          consents: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      },
    },
  });

  const propertyInput = {
    type: property.type,
    intent: property.intent,
    zone: property.zone,
    price: property.price,
    bedrooms: property.bedrooms,
    status: property.status,
  };

  let tasksCreated = 0;
  let contactsConsidered = 0;
  const since = new Date(Date.now() - FATIGUE_MS);

  for (const seq of sequences) {
    const contact = seq.contact;
    if (!hasFollowUpConsent(contact.consents)) continue;
    contactsConsidered++;

    const profile = selectPreferredSearchProfile(contact.searchProfiles);
    if (!profile) continue;

    const profileInput = {
      intent: profile.intent,
      propertyType: profile.propertyType,
      zone: profile.zone,
      minPrice: profile.minPrice,
      maxPrice: profile.maxPrice,
      bedrooms: profile.bedrooms,
    };

    const { score } = scorePropertyAgainstProfile(profileInput, propertyInput, { weights });
    if (score < MIN_PROPERTY_MATCH_SCORE) continue;

    const recent = await prisma.task.findFirst({
      where: {
        contactId: contact.id,
        title: { startsWith: REACTIVATION_TITLE_PREFIX },
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) continue;

    await prisma.task.create({
      data: {
        contactId: contact.id,
        title: `${REACTIVATION_TITLE_PREFIX}Nueva propiedad (${score}% match): ${property.title.slice(0, 180)}`,
        description: `F2-E4: revisar reenganche. Propiedad ${property.id}. Score de match ${score}%.`,
        type: "followup",
        status: "pending",
      },
    });
    tasksCreated++;
  }

  logStructured("property_reactivation_tasks_created", {
    accountId: params.accountId,
    propertyId: params.propertyId,
    tasksCreated,
    contactsConsidered,
  });

  return { tasksCreated, contactsConsidered };
}
