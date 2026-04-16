/**
 * Registro normalizado tras parsear la respuesta JSON de KiteProp (forma flexible).
 * La API real puede variar: el adapter documenta claves intentadas.
 */
export type NormalizedKitepropImport = {
  externalLeadId?: string;
  externalMessageId?: string;
  externalContactId?: string;
  email?: string;
  phone?: string;
  name?: string;
  messageBody?: string;
  occurredAt: Date;
  propertyExternalId?: string;
  propertyExternalSource?: string;
  channelRaw?: string;
  portalRaw?: string;
  raw: unknown;
};

export type KitepropRestFetchParams = {
  since: Date;
  until: Date;
};
