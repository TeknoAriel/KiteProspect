// properties — inventario (F1-E4)
export * from "./property-types";
export { serializeProperty } from "./property-serialization";
export {
  parsePropertyCreateBody,
  parsePropertyPatchBody,
  PROPERTY_INTENTS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "./validate-property-payload";
