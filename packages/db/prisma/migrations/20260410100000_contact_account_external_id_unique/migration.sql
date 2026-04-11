-- F3-E1+ (L27): integridad CRM — un externalId por cuenta cuando está definido.
CREATE UNIQUE INDEX "Contact_accountId_externalId_key" ON "Contact" ("accountId", "externalId");
