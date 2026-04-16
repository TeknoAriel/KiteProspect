/**
 * Arranque del runtime Node: validación de env en producción.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { validateServerEnvOrThrow } = await import("./src/lib/validate-env");
  validateServerEnvOrThrow();
}
