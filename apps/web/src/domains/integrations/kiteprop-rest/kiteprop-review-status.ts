/**
 * Estados de revisión humana para import KiteProp + borradores (string en BD).
 * No cambiar valores sin migración de datos / compat.
 */
export const KITEPROP_REVIEW_STATUS = {
  IMPORTED_REAL_LEAD: "imported_real_lead",
  DRAFT_PENDING_REVIEW: "draft_pending_review",
  MANUAL_REVIEW_REQUIRED: "manual_review_required",
  APPROVED_TO_SEND: "approved_to_send",
  SENT: "sent",
  DISCARDED: "discarded",
} as const;

export type KitepropReviewStatus =
  (typeof KITEPROP_REVIEW_STATUS)[keyof typeof KITEPROP_REVIEW_STATUS];

export const KITEPROP_REVIEW_STATUS_LIST: readonly KitepropReviewStatus[] = [
  KITEPROP_REVIEW_STATUS.IMPORTED_REAL_LEAD,
  KITEPROP_REVIEW_STATUS.DRAFT_PENDING_REVIEW,
  KITEPROP_REVIEW_STATUS.MANUAL_REVIEW_REQUIRED,
  KITEPROP_REVIEW_STATUS.APPROVED_TO_SEND,
  KITEPROP_REVIEW_STATUS.SENT,
  KITEPROP_REVIEW_STATUS.DISCARDED,
];
