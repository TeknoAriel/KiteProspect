-- L22 F3-E1+: evento `contact.external_id_updated` en default de nuevas suscripciones.
ALTER TABLE "WebhookSubscription" ALTER COLUMN "events" SET DEFAULT '["lead.captured","contact.assignment_changed","contact.stages_updated","follow_up.sequence_started","contact.external_id_updated"]'::jsonb;
