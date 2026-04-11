"use client";

import { CONVERSATION_SCENARIOS } from "@/domains/conversations/simulation/conversation-scenarios";
import type { SingleScenarioRunResult } from "@/domains/conversations/simulation/run-single-scenario";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type RunRow = { id: string; label: string; createdAt: string };

export function DemoSimulationClient() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: CONVERSATION_SCENARIOS.length });
  const [log, setLog] = useState<string[]>([]);
  const [includeFollowUpLab, setIncludeFollowUpLab] = useState(true);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/demo/simulation/runs");
    const data = (await res.json()) as { runs?: RunRow[]; error?: string };
    if (res.ok && data.runs) setRuns(data.runs);
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const runAll = async () => {
    setError(null);
    setLastSavedId(null);
    setRunning(true);
    setLog([]);
    const results: SingleScenarioRunResult[] = [];
    const total = CONVERSATION_SCENARIOS.length;
    setProgress({ done: 0, total });

    try {
      for (let i = 0; i < CONVERSATION_SCENARIOS.length; i++) {
        const key = CONVERSATION_SCENARIOS[i]!.key;
        setLog((prev) => [...prev, `→ ${key}…`]);
        const res = await fetch("/api/demo/simulation/run-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioKey: key }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          result?: SingleScenarioRunResult;
          error?: string;
        };
        if (!res.ok || !data.result) {
          throw new Error(data.error ?? `Fallo en ${key}`);
        }
        results.push(data.result);
        setProgress({ done: i + 1, total });
        setLog((prev) => {
          const next = [...prev];
          next[next.length - 1] = `✓ ${key}`;
          return next;
        });
      }

      const saveRes = await fetch("/api/demo/simulation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioResults: results,
          includeFollowUpLab,
        }),
      });
      const saveData = (await saveRes.json()) as { id?: string; error?: string };
      if (!saveRes.ok || !saveData.id) {
        throw new Error(saveData.error ?? "No se pudo guardar el reporte");
      }
      setLastSavedId(saveData.id);
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/dashboard"
          style={{ textDecoration: "none", color: "#0070f3", fontSize: "0.875rem" }}
        >
          ← Operaciones
        </Link>
        <h1 style={{ marginTop: "0.75rem", marginBottom: "0.35rem" }}>
          Laboratorio: 20 escenarios
        </h1>
        <p style={{ margin: 0, color: "#555", fontSize: "0.9rem", lineHeight: 1.5 }}>
          Cada escenario crea un contacto y una conversación nuevos, ejecuta los turnos con la misma
          IA que el inbox y guarda el resultado. Incluye casos razonables y otros absurdos para ver
          cómo responden las reglas y el modelo. Requiere{" "}
          <code style={{ fontSize: "0.8rem" }}>OPENAI_API_KEY</code> o{" "}
          <code style={{ fontSize: "0.8rem" }}>GEMINI_API_KEY</code>.
        </p>
      </header>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        <input
          type="checkbox"
          checked={includeFollowUpLab}
          disabled={running}
          onChange={(e) => setIncludeFollowUpLab(e.target.checked)}
        />
        Incluir un tick de seguimiento de laboratorio (plan activo de la cuenta, aislado al tenant)
      </label>

      <button
        type="button"
        onClick={() => void runAll()}
        disabled={running}
        style={{
          padding: "0.6rem 1.2rem",
          cursor: running ? "wait" : "pointer",
          marginBottom: "1rem",
        }}
      >
        {running
          ? `Ejecutando… ${progress.done}/${progress.total}`
          : "Ejecutar 20 escenarios y guardar reporte"}
      </button>

      {error && (
        <p style={{ color: "#b00", fontSize: "0.9rem" }}>{error}</p>
      )}

      {lastSavedId && (
        <p style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
          Reporte guardado.{" "}
          <Link href={`/dashboard/demo-simulation/${lastSavedId}`} style={{ color: "#0070f3" }}>
            Ver informe y Markdown
          </Link>
        </p>
      )}

      {running && (
        <p style={{ fontSize: "0.85rem", color: "#666" }}>
          Progreso: {progress.done} / {progress.total} (puede tardar varios minutos)
        </p>
      )}

      {log.length > 0 && (
        <details style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#444" }}>
          <summary>Log de escenarios</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{log.join("\n")}</pre>
        </details>
      )}

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Ejecuciones recientes</h2>
        {runs.length === 0 ? (
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Aún no hay reportes guardados.</p>
        ) : (
          <ul style={{ paddingLeft: "1.25rem" }}>
            {runs.map((r) => (
              <li key={r.id} style={{ marginBottom: "0.35rem" }}>
                <Link href={`/dashboard/demo-simulation/${r.id}`} style={{ color: "#0070f3" }}>
                  {new Date(r.createdAt).toLocaleString()} — {r.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: "2rem", fontSize: "0.85rem", color: "#666" }}>
        <h2 style={{ fontSize: "1rem", color: "#333" }}>Lista de escenarios</h2>
        <ol style={{ paddingLeft: "1.25rem", lineHeight: 1.6 }}>
          {CONVERSATION_SCENARIOS.map((s) => (
            <li key={s.key}>
              <strong>{s.title}</strong> — {s.intent} ({s.channel}, {s.turns.length} turnos)
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
