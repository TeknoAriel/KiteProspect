// followups — seguimiento, secuencias
export type {
  ProcessDueFollowUpsInput,
  ProcessDueFollowUpsResult,
} from "./follow-up-job-contract";
export {
  processDueFollowUps,
  parsePlanSequence,
} from "./services/process-due-follow-ups";
export type { SequenceStep } from "./services/process-due-follow-ups";
