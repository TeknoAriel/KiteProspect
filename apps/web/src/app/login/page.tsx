"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [accountSlug, setAccountSlug] = useState("demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        accountSlug,
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
        <h1 style={{ marginBottom: "2rem", textAlign: "center" }}>Kite Prospect</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="accountSlug" style={{ display: "block", marginBottom: "0.5rem" }}>
              Cuenta (slug)
            </label>
            <input
              id="accountSlug"
              type="text"
              value={accountSlug}
              onChange={(e) => setAccountSlug(e.target.value)}
              required
              autoComplete="organization"
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          </div>
          {error && (
            <div style={{ color: "red", fontSize: "0.875rem" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666", textAlign: "center" }}>
          Demo: slug <strong>demo</strong>, email <strong>admin@demo.local</strong>, contraseña <strong>demo123</strong>
        </p>
      </div>
    </div>
  );
}
