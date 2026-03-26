# Decisión: ejecución de seguimientos por cron (Sprint S07 / F1-E12)

## Implementado

1. **Servicio** `processDueFollowUps` — lee secuencias `active` con `nextAttemptAt <= now()`, hasta `FOLLOW_UP_CRON_BATCH_LIMIT` (default 25).
2. **Pasos** desde `FollowUpPlan.sequence` (JSON): `delayHours`, `channel`, `objective`. Tras cada paso se programa el siguiente con el `delayHours` del **siguiente** paso.
3. **FollowUpAttempt:** si el paso tiene `channel: "whatsapp"`, tras crear el intento se llama a `sendWhatsAppTextToContact` (texto = `objective` o default); `outcome` `sent` / `failed`. Otros canales siguen `queued` sin envío.
4. **Auditoría** `follow_up_step_executed` por paso.
5. **Ruta** `GET|POST /api/cron/follow-up-due`:
   - Requiere `CRON_SECRET` en entorno.
   - Auth: `Authorization: Bearer <CRON_SECRET>` **o** cabecera `x-vercel-cron: 1` (invocación oficial de Vercel Cron).
6. **Vercel** `apps/web/vercel.json`: cron cada 5 minutos.
7. **Seed** demo: `FollowUpSequence` con primer paso `delayHours: 0` y `nextAttemptAt` inmediato.

## Manual (prueba local)

```bash
curl -sS -H "Authorization: Bearer TU_CRON_SECRET" "http://localhost:3000/api/cron/follow-up-due"
```

## Referencias

- `apps/web/src/domains/followups/services/process-due-follow-ups.ts`
- `apps/web/src/app/api/cron/follow-up-due/route.ts`
- `docs/decisions/slice-s06-job-runner-followups.md`
