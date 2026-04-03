-- Fecha de última actualización según el feed (control incremental id + fecha)
ALTER TABLE "Property" ADD COLUMN "externalFeedUpdatedAt" TIMESTAMP(3);
