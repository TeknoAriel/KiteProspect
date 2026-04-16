import { describe, expect, it } from "vitest";
import { parseProppitPropertyJson } from "./parse-proppit-json";

describe("parseProppitPropertyJson — forma KiteProp externalsite", () => {
  it("mapea for_sale_price, content, last_update y guarda rawRecord", () => {
    const row = {
      id: 183783,
      last_update: "2025-07-16T17:48:02.000000Z",
      status: "reserved",
      url: "https://example.com/p/183783",
      title: "Lote test",
      content: "Descripción HTML o texto",
      property_type: "residential_lands",
      for_sale: true,
      for_sale_price: "125000.50",
      for_rent: false,
      currency: "USD",
      address: "Ruta 9 km 100",
      city: "Rosario",
      region: "Santa Fe",
      country: "AR",
      zone: "Norte",
      bedrooms: 0,
      bathrooms: 0,
      total_meters: "5300",
      covered_meters: "0",
      latitude: "-32.9",
      longitude: "-60.7",
      images: [{}, {}, {}],
    };
    const [listing] = parseProppitPropertyJson(JSON.stringify([row]));
    expect(listing).toBeDefined();
    expect(listing!.externalId).toBe("183783");
    expect(listing!.intent).toBe("venta");
    expect(listing!.price).toBeCloseTo(125000.5);
    expect(listing!.description).toContain("Descripción");
    expect(listing!.availabilityStatus).toBe("reserved");
    expect(listing!.feedFormat).toBe("kiteprop_json");
    expect(listing!.rawRecord?.id).toBe(183783);
    expect(listing!.amenities.kiteprop_image_count).toBe(3);
    expect(listing!.city).toBe("Rosario");
    expect(listing!.province).toBe("Santa Fe");
  });

  it("acepta array raíz legacy Proppit", () => {
    const [listing] = parseProppitPropertyJson(
      JSON.stringify([
        {
          id: "99",
          title: "X",
          price: 100000,
          currency: "ARS",
        },
      ]),
    );
    expect(listing?.feedFormat).toBe("proppit");
    expect(listing?.price).toBe(100000);
  });
});
