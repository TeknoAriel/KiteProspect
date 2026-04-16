-- Contact.metadata: campos de integración CRM (import API, conectores) sin ensanchar el modelo relacional.
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
