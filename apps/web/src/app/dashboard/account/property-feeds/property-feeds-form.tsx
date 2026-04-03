"use client";

import { useState } from "react";

export type KitepropFeedFormInitial = {
  enabled: boolean;
  proppitJsonUrl: string;
  zonapropXmlUrl: string;
  delistMissing: boolean;
  removalPolicy: "withdraw" | "delete";
  skipManifestIfUnchanged: boolean;
};

export function PropertyFeedsForm(props: { initial: KitepropFeedFormInitial }) {
  const [enabled, setEnabled] = useState(props.initial.enabled);
  const [proppitJsonUrl, setProppitJsonUrl] = useState(props.initial.proppitJsonUrl);
  const [zonapropXmlUrl, setZonapropXmlUrl] = useState(props.initial.zonapropXmlUrl);
  const [delistMissing, setDelistMissing] = useState(props.initial.delistMissing);
  const [removalPolicy, setRemovalPolicy] = useState<"withdraw" | "delete">(props.initial.removalPolicy);
  const [skipManifestIfUnchanged, setSkipManifestIfUnchanged] = useState(
    props.initial.skipManifestIfUnchanged,
  );
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/kiteprop-feed-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          proppitJsonUrl: proppitJsonUrl.trim() || null,
          zonapropXmlUrl: zonapropXmlUrl.trim() || null,
          delistMissing,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setMessage("Guardado.");
    } finally {
      setLoading(false);
    }
  }

  async function syncNow() {
    setError(null);
    setMessage(null);
    setSyncLoading(true);
    try {
      const res = await fetch("/api/account/kiteprop-feed-sync", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        skipped?: number;
        delisted?: number;
        deleted?: number;
        errors?: number;
        skippedDownload304?: number;
        skippedManifestUnchanged?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Error al sincronizar");
        return;
      }
      setMessage(
        `Sincronizado: +${data.created ?? 0} ~${data.updated ?? 0} omitidas ${data.skipped ?? 0} · bajas ${data.delisted ?? 0} · borradas ${data.deleted ?? 0} · 304 ${data.skippedDownload304 ?? 0} · manifiesto sin cambios ${data.skippedManifestUnchanged ?? 0} · errores ${data.errors ?? 0}`,
      );
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <form onSubmit={save}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Sincronización automática habilitada (cron en servidor, cada 30 minutos UTC en Vercel)
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="proppit-json-url"
            style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
          >
            URL JSON Proppit (delta / listado)
          </label>
          <input
            id="proppit-json-url"
            type="url"
            value={proppitJsonUrl}
            onChange={(e) => setProppitJsonUrl(e.target.value)}
            placeholder="https://…"
            style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="zonaprop-xml-url"
            style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
          >
            URL XML OpenNavent / Zonaprop (detalle y amenities)
          </label>
          <input
            id="zonaprop-xml-url"
            type="url"
            value={zonapropXmlUrl}
            onChange={(e) => setZonapropXmlUrl(e.target.value)}
            placeholder="https://…"
            style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
          />
          <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.35rem 0 0" }}>
            Si ambas están definidas, se fusionan por <code>codigoAviso</code>: el XML pisa campos del JSON para el mismo
            aviso.
          </p>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input type="checkbox" checked={delistMissing} onChange={(e) => setDelistMissing(e.target.checked)} />
            Aplicar retiro a avisos que ya no vengan en el snapshot del feed
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}>
            Política si falta en el feed (con la opción anterior activada)
          </label>
          <select
            value={removalPolicy}
            onChange={(e) => setRemovalPolicy(e.target.value as "withdraw" | "delete")}
            style={{ padding: "0.5rem", fontSize: "0.875rem" }}
          >
            <option value="withdraw">Marcar como withdrawn (histórico en BD)</option>
            <option value="delete">Borrar de la base (matches/recomendaciones en cascade)</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input
              type="checkbox"
              checked={skipManifestIfUnchanged}
              onChange={(e) => setSkipManifestIfUnchanged(e.target.checked)}
            />
            Si el manifiesto id + fecha del feed no cambió, omitir escrituras (y bajas) en esta corrida
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.5rem 1rem", cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          disabled={syncLoading}
          onClick={() => void syncNow()}
          style={{
            marginLeft: "0.75rem",
            padding: "0.5rem 1rem",
            cursor: syncLoading ? "wait" : "pointer",
          }}
        >
          {syncLoading ? "Sincronizando..." : "Sincronizar ahora"}
        </button>

        {message && (
          <p style={{ marginTop: "0.75rem", color: "#0a0", fontSize: "0.875rem" }}>{message}</p>
        )}
        {error && (
          <p style={{ color: "#c00", fontSize: "0.875rem", marginTop: "0.75rem" }}>{error}</p>
        )}
      </form>
    </div>
  );
}
