import type { ScoringJobPayload } from "../job-payloads";
import { runScoringAndQualificationPipeline } from "@/domains/activation/qualification-pipeline";
import { dispatchIntegrationOutbound, dispatchOrchestration } from "../dispatch";

export async function processScoringJob(
  payload: ScoringJobPayload,
): Promise<void> {
  const r = await runScoringAndQualificationPipeline({
    accountId: payload.accountId,
    contactId: payload.contactId,
    leadId: payload.leadId,
  });

  if (r.needsHandoffDispatch) {
    await dispatchIntegrationOutbound({
      accountId: payload.accountId,
      contactId: payload.contactId,
      leadId: payload.leadId,
    });
  }

  await dispatchOrchestration({
    accountId: payload.accountId,
    contactId: payload.contactId,
    leadId: payload.leadId,
  });
}
