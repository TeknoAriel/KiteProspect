"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateDeclaredSearchProfileAction } from "./contact-search-profile-actions";

type Initial = {
  intent: string;
  propertyType: string;
  zone: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  extraJson: string;
};

type Props = {
  contactId: string;
  initial: Initial;
};

import type { CSSProperties } from "react";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  marginBottom: "0.35rem",
  fontWeight: 600,
};

export function DeclaredProfileForm({ contactId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [intent, setIntent] = useState(initial.intent);
  const [propertyType, setPropertyType] = useState(initial.propertyType);
  const [zone, setZone] = useState(initial.zone);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
  const [bedrooms, setBedrooms] = useState(initial.bedrooms);
  const [bathrooms, setBathrooms] = useState(initial.bathrooms);
  const [extraJson, setExtraJson] = useState(initial.extraJson);

  return (
    <form
      style={{ marginBottom: "1.5rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData();
        fd.set("intent", intent);
        fd.set("propertyType", propertyType);
        fd.set("zone", zone);
        fd.set("minPrice", minPrice);
        fd.set("maxPrice", maxPrice);
        fd.set("bedrooms", bedrooms);
        fd.set("bathrooms", bathrooms);
        fd.set("extraJson", extraJson);
        startTransition(async () => {
          const res = await updateDeclaredSearchProfileAction(contactId, fd);
          if (res.ok) {
            setMessage("Perfil guardado.");
            router.refresh();
          } else {
            setMessage(res.error);
          }
        });
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Editar perfil declarado</h2>
      <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "#555" }}>
        El matching usa el perfil actualizado más recientemente (declarado o inferido). Tras guardar, recalculá matches
        desde la ficha del contacto si hace falta.
      </p>

      <div style={{ display: "grid", gap: "0.85rem", maxWidth: "520px" }}>
        <div>
          <label htmlFor="sp-intent" style={labelStyle}>
            Intención
          </label>
          <select id="sp-intent" value={intent} onChange={(e) => setIntent(e.target.value)} style={inputStyle}>
            <option value="">(vacío)</option>
            <option value="compra">compra</option>
            <option value="renta">renta</option>
            <option value="inversión">inversión</option>
          </select>
        </div>
        <div>
          <label htmlFor="sp-type" style={labelStyle}>
            Tipo de propiedad
          </label>
          <select id="sp-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={inputStyle}>
            <option value="">(vacío)</option>
            <option value="departamento">departamento</option>
            <option value="casa">casa</option>
            <option value="terreno">terreno</option>
          </select>
        </div>
        <div>
          <label htmlFor="sp-zone" style={labelStyle}>
            Zona
          </label>
          <input
            id="sp-zone"
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Ej. Palermo, CABA"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label htmlFor="sp-min" style={labelStyle}>
              Precio mínimo (ARS)
            </label>
            <input
              id="sp-min"
              type="number"
              min={0}
              step="1"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder=""
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="sp-max" style={labelStyle}>
              Precio máximo (ARS)
            </label>
            <input
              id="sp-max"
              type="number"
              min={0}
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder=""
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label htmlFor="sp-bed" style={labelStyle}>
              Dormitorios
            </label>
            <input
              id="sp-bed"
              type="number"
              min={0}
              max={50}
              step="1"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder=""
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="sp-bath" style={labelStyle}>
              Baños
            </label>
            <input
              id="sp-bath"
              type="number"
              min={0}
              max={50}
              step="1"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder=""
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label htmlFor="sp-extra" style={labelStyle}>
            Requisitos adicionales (JSON objeto, opcional)
          </label>
          <textarea
            id="sp-extra"
            value={extraJson}
            onChange={(e) => setExtraJson(e.target.value)}
            rows={4}
            placeholder='{"ascensor": true}'
            style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
          />
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.45rem 1rem",
            fontSize: "0.875rem",
            cursor: pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Guardando…" : "Guardar perfil declarado"}
        </button>
        {message && (
          <span
            role="status"
            style={{ fontSize: "0.875rem", color: message.includes("guardado") ? "#0a0" : "#c00" }}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
