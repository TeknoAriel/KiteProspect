export type IngestionJobPayload = {
  accountId: string;
  contactId: string;
  leadId: string;
  event: "lead.created";
};

export type ScoringJobPayload = {
  accountId: string;
  contactId: string;
  leadId: string;
  reason: "message.received" | "profile.updated";
};

export type OrchestrationJobPayload = {
  accountId: string;
  contactId: string;
  leadId: string;
};

export type FollowupJobPayload = {
  accountId: string;
  contactId: string;
  kind: "noop_demo";
};

export type IntegrationOutboundJobPayload = {
  accountId: string;
  contactId: string;
  leadId: string;
  attempt?: number;
};
