import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "640px" }}>
      <h1>Kite Prospect</h1>
      <p>Plataforma SaaS de prospección inmobiliaria asistida</p>
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/login" style={{ color: "#0070f3" }}>
          Entrar al panel
        </Link>
        {" · "}
        <Link href="/lead" style={{ color: "#0070f3" }}>
          Formulario de contacto (demo)
        </Link>
      </p>
      <p>
        <small>Alcance: PRODUCT_DEFINITION.md · Arranque: docs/setup-local.md</small>
      </p>
    </main>
  );
}
