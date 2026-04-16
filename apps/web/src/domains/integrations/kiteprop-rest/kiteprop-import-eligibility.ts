export function leadEligibleForImportDraft(
  lead: { status: string },
  existingReview: { reviewStatus: string; manualReviewRequired: boolean } | null,
): boolean {
  if (lead.status === "archived") return false;
  if (lead.status === "handed_off") return false;
  if (!existingReview) return true;
  const s = existingReview.reviewStatus;
  if (s === "approved_to_send" || s === "sent") return false;
  if (
    s === "draft_pending_review" ||
    s === "manual_review_required" ||
    s === "imported_real_lead"
  ) {
    return false;
  }
  if (s === "discarded") return true;
  return true;
}
