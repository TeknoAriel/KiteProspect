"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties } from "react";
import type { MatchingDimensionWeights } from "@/domains/auth-tenancy/account-matching-config";

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  marginBottom: "0.35rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  maxWidth: "120px",
  padding: "0.45rem",
  fontSize: "0.875rem",
  boxSizing: "border-box",
};

type Props = {
  initial: MatchingDimensionWeights;
};

export function MatchingConfigForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [intent, setIntent] = useState(String(initial.intent));
  const [type, setType] = useState(String(initial.type));
  const [zone, setZone] = useState(String(initial.zone));
  const [price, setPrice] = useState(String(initial.price));
  const [bedrooms, setBedrooms] = useState(String(initial.bedrooms));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const w: MatchingDimensionWeights = {
          intent: Number(intent) || 0,
          type: Number(type) || 0,
          zone: Number(zone) || 0,
          price: Number(price) || 0,
          bedrooms: Number(bedrooms) || 0,
        };
        startTransition(async () => {
          const res = await fetch("/api/account/matching-config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchingWeights: w }),
          });
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (res.ok && data.ok) {
            setMessage("Guardado.");
            router.refresh();
          } else {
            setMessage(data.error ?? "Error al guardar.");
          }
        });
      }}
    >
      <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
        Pesos por dimensión (números ≥ 0). Se <strong>normalizan</strong> a suma 100 en el servidor. Por defecto 20
        cada una. Afecta al próximo recálculo de matches por contacto.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.85rem",
          marginTop: "1rem",
          maxWidth: "640px",
        }}
      >
        <div>
          <label htmlFor="mw-intent" style={labelStyle}>
            Intención
          </label>
          <input
            id="mw-intent"
            type="number"
            min={0}
            step={1}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="mw-type" style={labelStyle}>
            Tipo
          </label>
          <input
            id="mw-type"
            type="number"
            min={0}
            step={1}
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="mw-zone" style={labelStyle}>
            Zona
          </label>
          <input
            id="mw-zone"
            type="number"
            min={0}
            step={1}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="mw-price" style={labelStyle}>
            Precio
          </label>
          <input
            id="mw-price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="mw-bed" style={labelStyle}>
            Dormitorios
          </label>
          <input
            id="mw-bed"
            type="number"
            min={0}
            step={1}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.45rem 1rem",
            fontSize: "0.875rem",
            cursor: pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Guardando…" : "Guardar pesos"}
        </button>
        {message && (
          <span
            role="status"
            style={{ fontSize: "0.875rem", color: message.includes("Guardado") ? "#0a0" : "#c00" }}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
