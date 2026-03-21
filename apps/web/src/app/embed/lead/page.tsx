import { LeadForm } from "@/app/lead/lead-form";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export const metadata = {
  title: "Contacto — Kite Prospect",
  robots: { index: false, follow: false } as const,
};

/**
 * Vista mínima para iframe (widget en sitios de terceros).
 * Misma lógica que /lead; canal `web_widget` para analítica / inbox.
 */
export default function EmbedLeadPage({ searchParams }: Props) {
  const raw = searchParams.slug;
  const accountSlug =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "demo" : "demo";
  const enabled = process.env.ENABLE_PUBLIC_LEAD_FORM === "true";

  return (
    <main
      style={{
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "520px",
        margin: "0 auto",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginTop: 0 }}>Contacto</h1>
      <LeadForm
        accountSlug={accountSlug}
        enabled={enabled}
        channel="web_widget"
        intro={
          <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 0.5rem" }}>
            Cuenta: <strong>{accountSlug}</strong>
          </p>
        }
      />
    </main>
  );
}
