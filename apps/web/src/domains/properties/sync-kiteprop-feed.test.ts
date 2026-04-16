import { describe, expect, it } from "vitest";
import { computeFeedManifestSha256 } from "./sync-kiteprop-feed";
import type { FeedListing } from "./kiteprop-feed-types";

function minimalListing(overrides: Partial<FeedListing>): FeedListing {
  return {
    externalId: "1",
    feedUpdatedAt: null,
    title: "t",
    description: "",
    type: "departamento",
    intent: "venta",
    price: 1,
    currency: "ARS",
    zone: "",
    address: "",
    bedrooms: null,
    bathrooms: null,
    rooms: null,
    surfaceTotal: null,
    surfaceCovered: null,
    latitude: null,
    longitude: null,
    amenities: {},
    referenceKey: "",
    availabilityStatus: "available",
    feedFormat: "proppit",
    ...overrides,
  };
}

describe("computeFeedManifestSha256", () => {
  it("es estable ante orden de entrada (ordena por id)", () => {
    const a = minimalListing({ externalId: "b", feedUpdatedAt: "2026-01-02T00:00:00.000Z" });
    const b = minimalListing({ externalId: "a", feedUpdatedAt: "2026-01-01T00:00:00.000Z" });
    const h1 = computeFeedManifestSha256([a, b]);
    const h2 = computeFeedManifestSha256([b, a]);
    expect(h1).toBe(h2);
  });

  it("cambia si cambia la fecha de feed", () => {
    const a = minimalListing({ externalId: "x", feedUpdatedAt: "2026-01-01T00:00:00.000Z" });
    const b = minimalListing({ externalId: "x", feedUpdatedAt: "2026-01-02T00:00:00.000Z" });
    expect(computeFeedManifestSha256([a])).not.toBe(computeFeedManifestSha256([b]));
  });
});
