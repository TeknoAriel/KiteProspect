"use client";

import type { SimulationPayloadV1 } from "@/domains/conversations/simulation/simulation-payload";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DemoSimulationRunView() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [payload, setPayload] = useState<SimulationPayloadV1 | null>(null);
  const [meta, setMeta] = useState<{ label: string; createdAt: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/demo/simulation/runs/${id}`);
        const data = (await res.json()) as {
          error?: string;
          markdown?: string;
          payload?: SimulationPayloadV1;
          label?: string;
          createdAt?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Error al cargar");
        }
        if (cancelled) return;
        setMarkdown(data.markdown ?? null);
        setPayload(data.payload ?? null);
        if (data.label && data.createdAt) {
          setMeta({ label: data.label, createdAt: data.createdAt });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadMd = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kite-lab-${id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Cargando informe…</p>;
  }
  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "#b00" }}>{error}</p>
        <Link href="/dashboard/demo-simulation" style={{ color: "#0070f3" }}>
          Volver al laboratorio
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", fontFamily: "system-ui" }}>
      <Link
        href="/dashboard/demo-simulation"
        style={{ fontSize: "0.875rem", color: "#0070f3" }}
      >
        ← Laboratorio
      </Link>
      <header style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.35rem" }}>Informe de ejecución</h1>
        {meta && (
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            {meta.label} · {new Date(meta.createdAt).toLocaleString()}
          </p>
        )}
        <button
          type="button"
          onClick={downloadMd}
          disabled={!markdown}
          style={{ marginTop: "0.75rem", padding: "0.4rem 0.9rem", cursor: "pointer" }}
        >
          Descargar .md
        </button>
      </header>

      {payload && (
        <section style={{ marginBottom: "2rem", fontSize: "0.88rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Resumen rápido</h2>
          <ul style={{ lineHeight: 1.6 }}>
            <li>
              Escenarios: <strong>{payload.scenarioResults.length}</strong>
            </li>
            {payload.followUpLab && (
              <li>
                Seguimiento (lab):{" "}
                {payload.followUpLab.ok ? (
                  <>
                    plan <code>{payload.followUpLab.planName}</code>, intentos cron{" "}
                    {payload.followUpLab.cron.attemptsCreated}
                  </>
                ) : (
                  <span>Omitido: {payload.followUpLab.reason}</span>
                )}
              </li>
            )}
          </ul>
        </section>
      )}

      {markdown && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "0.82rem",
            lineHeight: 1.45,
            padding: "1rem",
            background: "#fafafa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "auto",
          }}
        >
          {markdown}
        </pre>
      )}
    </div>
  );
}
