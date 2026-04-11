-- Ampliar default de eventos suscritos (L24 / F3-E3); filas existentes no se modifican.
ALTER TABLE "WebhookSubscription" ALTER COLUMN "events" SET DEFAULT '["lead.captured","contact.assignment_changed","contact.stages_updated","follow_up.sequence_started"]'::jsonb;
