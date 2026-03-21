import Link from "next/link";
import { LeadForm } from "./lead-form";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function LeadPage({ searchParams }: Props) {
  const raw = searchParams.slug;
  const accountSlug =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "demo" : "demo";
  const enabled = process.env.ENABLE_PUBLIC_LEAD_FORM === "true";

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "640px" }}>
      <h1>Contacto</h1>
      <p style={{ color: "#444" }}>
        Cuenta: <strong>{accountSlug}</strong> — otra cuenta:{" "}
        <Link href={`/lead?slug=otro-slug`} style={{ color: "#0070f3" }}>
          ?slug=…
        </Link>
      </p>
      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        Uso interno / demo: el secreto <code>CAPTURE_API_SECRET</code> no se expone en el navegador. Para
        landings externas usa un backend intermedio o la API HTTP (ver{" "}
        <code style={{ fontSize: "0.85rem" }}>docs/capture-integration.md</code> en el repositorio).
      </p>
      <LeadForm accountSlug={accountSlug} enabled={enabled} />

      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "#0070f3" }}>
          Volver al inicio
        </Link>
        {" · "}
        <Link href="/login" style={{ color: "#0070f3" }}>
          Panel
        </Link>
      </p>
    </main>
  );
}
