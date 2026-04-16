import { describe, expect, it } from "vitest";
import { leadEligibleForImportDraft } from "./kiteprop-import-eligibility";

describe("leadEligibleForImportDraft", () => {
  it("handed_off → false", () => {
    expect(
      leadEligibleForImportDraft({ status: "handed_off" }, null),
    ).toBe(false);
  });

  it("open sin revisión previa → true", () => {
    expect(leadEligibleForImportDraft({ status: "open" }, null)).toBe(true);
  });

  it("draft_pending_review → false", () => {
    expect(
      leadEligibleForImportDraft(
        { status: "open" },
        { reviewStatus: "draft_pending_review", manualReviewRequired: false },
      ),
    ).toBe(false);
  });

  it("manual_review_required → false", () => {
    expect(
      leadEligibleForImportDraft(
        { status: "open" },
        { reviewStatus: "manual_review_required", manualReviewRequired: true },
      ),
    ).toBe(false);
  });

  it("discarded → true (reimport)", () => {
    expect(
      leadEligibleForImportDraft(
        { status: "open" },
        { reviewStatus: "discarded", manualReviewRequired: false },
      ),
    ).toBe(true);
  });
});
