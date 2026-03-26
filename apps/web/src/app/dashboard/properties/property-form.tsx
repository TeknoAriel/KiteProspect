"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SerializedProperty } from "@/domains/properties/property-types";
import {
  PROPERTY_INTENTS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/domains/properties/validate-property-payload";

type Props = {
  canMutate: boolean;
  mode: "create" | "edit";
  initial?: SerializedProperty;
};

export function PropertyForm({ canMutate, mode, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState(initial?.type ?? "departamento");
  const [intent, setIntent] = useState(initial?.intent ?? "venta");
  const [zone, setZone] = useState(initial?.zone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [bedrooms, setBedrooms] = useState(
    initial?.bedrooms !== null && initial?.bedrooms !== undefined ? String(initial.bedrooms) : "",
  );
  const [bathrooms, setBathrooms] = useState(
    initial?.bathrooms !== null && initial?.bathrooms !== undefined ? String(initial.bathrooms) : "",
  );
  const [area, setArea] = useState(initial?.area ?? "");
  const [status, setStatus] = useState(initial?.status ?? "available");

  if (!canMutate) {
    if (mode === "edit" && initial) {
      return (
        <dl style={{ margin: 0, fontSize: "0.875rem", display: "grid", gap: "0.75rem" }}>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Título</dt>
            <dd style={{ margin: 0 }}>{initial.title}</dd>
          </div>
          {initial.description && (
            <div>
              <dt style={{ color: "#666", margin: 0 }}>Descripción</dt>
              <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{initial.description}</dd>
            </div>
          )}
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Tipo / operación</dt>
            <dd style={{ margin: 0 }}>
              {initial.type} · {initial.intent}
            </dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Precio</dt>
            <dd style={{ margin: 0 }}>{initial.price}</dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Zona / dirección</dt>
            <dd style={{ margin: 0 }}>
              {[initial.zone, initial.address].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: "#666", margin: 0 }}>Estado</dt>
            <dd style={{ margin: 0 }}>{initial.status}</dd>
          </div>
        </dl>
      );
    }
    return (
      <p style={{ color: "#666" }}>
        Solo administradores o coordinadores pueden crear o editar propiedades.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        type,
        intent,
        price: price.trim() === "" ? null : Number(price),
        status,
      };
      if (description.trim()) payload.description = description.trim();
      else payload.description = null;
      payload.zone = zone.trim() === "" ? null : zone.trim();
      payload.address = address.trim() === "" ? null : address.trim();
      if (bedrooms.trim() === "") payload.bedrooms = null;
      else payload.bedrooms = parseInt(bedrooms, 10);
      if (bathrooms.trim() === "") payload.bathrooms = null;
      else payload.bathrooms = parseInt(bathrooms, 10);
      if (area.trim() === "") payload.area = null;
      else payload.area = Number(area);

      const url = mode === "create" ? "/api/properties" : `/api/properties/${initial!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string; property?: { id: string } };
      if (!res.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      router.push("/dashboard/properties");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", maxWidth: "520px" }}>
      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "#fee", borderRadius: "6px", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Título</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Descripción (opcional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ padding: "0.5rem" }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "0.5rem" }}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Operación</span>
          <select value={intent} onChange={(e) => setIntent(e.target.value)} style={{ padding: "0.5rem" }}>
            {PROPERTY_INTENTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Precio</span>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Zona (opcional)</span>
        <input value={zone} onChange={(e) => setZone(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Dirección (opcional)</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: "0.5rem" }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Dormitorios</span>
          <input
            type="number"
            min={0}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            style={{ padding: "0.5rem" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Baños</span>
          <input
            type="number"
            min={0}
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            style={{ padding: "0.5rem" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span>Superficie (m²)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{ padding: "0.5rem" }}
          />
        </label>
      </div>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Estado</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.5rem" }}>
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <button type="submit" disabled={pending} style={{ padding: "0.5rem 1rem", cursor: pending ? "wait" : "pointer" }}>
          {pending ? "Guardando…" : mode === "create" ? "Crear propiedad" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
