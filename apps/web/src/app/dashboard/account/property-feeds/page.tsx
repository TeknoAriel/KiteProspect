import { extractKitepropFeedFromConfig } from "@/domains/auth-tenancy/account-kiteprop-feed-config";
import { requireAuth } from "@/lib/server-utils";
import { prisma } from "@kite-prospect/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PropertyFeedsForm } from "./property-feeds-form";

export default async function AccountPropertyFeedsPage() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { config: true },
  });

  if (!account) {
    redirect("/dashboard");
  }

  const kiteprop = extractKitepropFeedFromConfig(account.config);

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Link href="/dashboard/account" style={{ textDecoration: "none", color: "#0070f3" }}>
        ← Centro de configuración
      </Link>
      <h1 style={{ marginTop: "1rem" }}>Feeds de inventario (KiteProp)</h1>
      <p style={{ color: "#666", fontSize: "0.875rem", maxWidth: "40rem", lineHeight: 1.5 }}>
        Configuración en <code>Account.config.kitepropFeed</code>. El job usa HTTP condicional (304), manifiesto
        id+fecha para omitir trabajo si no hubo cambios, y política de baja (withdrawn o borrado) para avisos que ya
        no figuren en el snapshot.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <PropertyFeedsForm
          initial={{
            enabled: kiteprop.enabled,
            proppitJsonUrl: kiteprop.proppitJsonUrl,
            zonapropXmlUrl: kiteprop.zonapropXmlUrl,
            delistMissing: kiteprop.delistMissing,
            removalPolicy: kiteprop.removalPolicy,
            skipManifestIfUnchanged: kiteprop.skipManifestIfUnchanged,
          }}
        />
      </div>
    </div>
  );
}
