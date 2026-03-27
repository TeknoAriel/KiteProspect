"use client";

import { useState } from "react";

type Initial = {
  name: string;
  timezone?: string;
};

export function GeneralConfigForm(props: { initial: Initial }) {
  const [name, setName] = useState(props.initial.name ?? "");
  const [timezone, setTimezone] = useState(props.initial.timezone ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/general-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          timezone: timezone.trim() || null,
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

  return (
    <form onSubmit={save} style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="account-name"
          style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
        >
          Nombre comercial de la cuenta
        </label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
          style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="timezone"
          style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}
        >
          Timezone operativa
        </label>
        <input
          id="timezone"
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          maxLength={80}
          placeholder="Ej: America/Argentina/Buenos_Aires"
          style={{ width: "100%", padding: "0.5rem", fontSize: "0.875rem" }}
        />
        <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.35rem 0 0" }}>
          Se persiste en <code>Account.config.timezone</code>.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "0.5rem 1rem", cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>

      {message && (
        <span style={{ marginLeft: "1rem", color: "#0a0", fontSize: "0.875rem" }}>
          {message}
        </span>
      )}
      {error && (
        <p style={{ color: "#c00", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
    </form>
  );
}
