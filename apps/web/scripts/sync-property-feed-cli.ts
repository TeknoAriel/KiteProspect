/**
 * Sincroniza inventario desde una URL JSON (feed KiteProp) para la cuenta demo u otra.
 * Uso: dotenv -e .env -- npx tsx apps/web/scripts/sync-property-feed-cli.ts
 *
 * Variables opcionales:
 * - PROPERTY_FEED_ACCOUNT_SLUG (default: demo)
 * - KITEPROP_FEED_JSON_URL — si se omite, usa el feed externalsite de referencia del proyecto.
 */
import { prisma } from "@kite-prospect/db";
import type { Prisma } from "@kite-prospect/db";
import {
  applyKitepropFeedSyncStatePatch,
  extractKitepropFeedFromConfig,
  mergeKitepropFeedIntoAccountConfig,
} from "../src/domains/auth-tenancy/account-kiteprop-feed-config";
import { syncKitepropFeedForAccount } from "../src/domains/properties/sync-kiteprop-feed";

const DEFAULT_FEED =
  "https://static.kiteprop.com/kp/difusions/4b3c894a10d905c82e85b35c410d7d4099551504/externalsite-3017-cc916af00ebbd34ec32c7390ebf52a1b915c7824.json";

async function main() {
  const slug = process.env.PROPERTY_FEED_ACCOUNT_SLUG?.trim() || "demo";
  const feedUrl = process.env.KITEPROP_FEED_JSON_URL?.trim() || DEFAULT_FEED;
  console.error(`[property-feed:sync] cuenta=${slug} url=${feedUrl}`);

  const account = await prisma.account.findUnique({
    where: { slug },
    select: { id: true, config: true },
  });
  if (!account) {
    console.error(`No existe cuenta con slug="${slug}".`);
    process.exit(1);
  }

  const merged = mergeKitepropFeedIntoAccountConfig(account.config, {
    enabled: true,
    proppitJsonUrl: feedUrl,
    zonapropXmlUrl: "",
  });

  await prisma.account.update({
    where: { id: account.id },
    data: { config: merged },
  });

  const cfg = extractKitepropFeedFromConfig(merged as Prisma.JsonValue);
  const outcome = await syncKitepropFeedForAccount({
    accountId: account.id,
    proppitJsonUrl: cfg.proppitJsonUrl,
    zonapropXmlUrl: cfg.zonapropXmlUrl,
    delistMissing: cfg.delistMissing,
    removalPolicy: cfg.removalPolicy,
    skipManifestIfUnchanged: cfg.skipManifestIfUnchanged,
    lastMergedManifestSha256: cfg.lastMergedManifestSha256,
    lastProppitEtag: cfg.lastProppitEtag,
    lastProppitLastModified: cfg.lastProppitLastModified,
    lastXmlEtag: cfg.lastXmlEtag,
    lastXmlLastModified: cfg.lastXmlLastModified,
  });

  if (Object.keys(outcome.syncStatePatch).length > 0) {
    const fresh = await prisma.account.findUnique({
      where: { id: account.id },
      select: { config: true },
    });
    await prisma.account.update({
      where: { id: account.id },
      data: {
        config: applyKitepropFeedSyncStatePatch(fresh?.config ?? null, outcome.syncStatePatch),
      },
    });
  }

  console.log(JSON.stringify({ ok: true, accountSlug: slug, feedUrl, stats: outcome.stats }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
