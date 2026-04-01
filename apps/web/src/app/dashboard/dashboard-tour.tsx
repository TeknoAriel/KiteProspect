"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kite-dashboard-tour-dismissed-v1";
const SESSION_KEY = "kite-dashboard-tour-session-dismissed-v1";
const OPEN_EVENT = "kite-dashboard-tour-open";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Flujo general",
    body: "Las consultas entran por canales (formulario, WhatsApp, widget, landing). Cada una abre o continúa una conversación, crea o actualiza un contacto y deja trazabilidad en auditoría. El inventario es la base: el sistema no inventa propiedades.",
  },
  {
    title: "Inbox",
    body: "Aquí ves hilos por canal y estado. Podés abrir un contacto, usar la asistencia de IA con reglas de negocio y, cuando corresponda, enviar un borrador por WhatsApp con revisión humana.",
  },
  {
    title: "Contactos y CRM",
    body: "La ficha concentra etapa comercial, perfil declarado, score (intención, preparación, encaje, engagement) y matching contra propiedades disponibles. Las recomendaciones usan solo inventario real.",
  },
  {
    title: "Propiedades",
    body: "El ABM mantiene disponibilidad y datos verificables. Los feeds KiteProp (si los configurás) sincronizan sin pisar cierres manuales en estados finales.",
  },
  {
    title: "Seguimiento",
    body: "Los planes tienen intensidad baja / media / alta (ritmo entre pasos). Cada paso define canal (email, WhatsApp, Instagram manual, etc.) y demoras en horas. El cron del servidor ejecuta lo vencido; en desarrollo podés revisar planes y secuencias en esta sección.",
  },
  {
    title: "Configuración",
    body: "Administración: cuenta, planes de seguimiento en JSON validado, feeds de inventario, IA y zona horaria. Los datos demo incluyen varios planes de ejemplo para comparar ritmos y canales.",
  },
];

export function DashboardTour() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const dismiss = useCallback((permanent: boolean) => {
    try {
      if (permanent) {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } else {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  if (!mounted || !open) {
    return <TourLauncher />;
  }

  const s = STEPS[step];
  const last = step >= STEPS.length - 1;

  return (
    <>
      <TourLauncher />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kite-tour-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "32rem",
            width: "100%",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "#666" }}>
            Recorrido ({step + 1}/{STEPS.length})
          </p>
          <h2 id="kite-tour-title" style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>
            {s.title}
          </h2>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", lineHeight: 1.55, color: "#333" }}>{s.body}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => dismiss(false)}
              style={{ padding: "0.45rem 0.9rem", cursor: "pointer", border: "1px solid #ccc", background: "#fff" }}
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => dismiss(true)}
              style={{ padding: "0.45rem 0.9rem", cursor: "pointer", border: "1px solid #ccc", background: "#f5f5f5" }}
            >
              No volver a mostrar
            </button>
            {!last ? (
              <button
                type="button"
                onClick={() => setStep((x) => x + 1)}
                style={{
                  padding: "0.45rem 0.9rem",
                  cursor: "pointer",
                  border: "none",
                  background: "#0070f3",
                  color: "#fff",
                }}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={() => dismiss(true)}
                style={{
                  padding: "0.45rem 0.9rem",
                  cursor: "pointer",
                  border: "none",
                  background: "#0070f3",
                  color: "#fff",
                }}
              >
                Listo
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TourLauncher() {
  return (
    <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 900 }}>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
            window.sessionStorage.removeItem(SESSION_KEY);
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event(OPEN_EVENT));
        }}
        style={{
          padding: "0.5rem 0.85rem",
          fontSize: "0.85rem",
          cursor: "pointer",
          border: "1px solid #0070f3",
          background: "#fff",
          color: "#0070f3",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        Cómo funciona Kite
      </button>
    </div>
  );
}
