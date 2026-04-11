import type { FollowUpLabResult } from "./run-follow-up-lab";
import type { SingleScenarioRunResult } from "./run-single-scenario";

export type SimulationPayloadV1 = {
  version: 1;
  createdAtIso: string;
  scenarioResults: SingleScenarioRunResult[];
  followUpLab?: FollowUpLabResult;
};

export function buildMarkdownReport(p: SimulationPayloadV1): string {
  const lines: string[] = [];
  lines.push(`# Laboratorio: 20 escenarios conversacionales`);
  lines.push("");
  lines.push(`Generado: ${p.createdAtIso}`);
  lines.push("");

  let i = 0;
  for (const s of p.scenarioResults) {
    i++;
    lines.push(`## ${i}. ${s.title} (\`${s.scenarioKey}\`)`);
    lines.push("");
    lines.push(`- **Canal:** ${s.channel}`);
    lines.push(`- **Intención del caso:** ${s.intent}`);
    lines.push(`- **Contacto:** \`${s.contactId}\` · **Conversación:** \`${s.conversationId}\``);
    lines.push("");
    let t = 0;
    for (const turn of s.turns) {
      t++;
      lines.push(`### Turno ${t} — ${turn.label}`);
      lines.push("");
      lines.push("**Lead (inbound)**");
      lines.push("");
      lines.push("```");
      lines.push(turn.inbound);
      lines.push("```");
      lines.push("");
      lines.push("**Sistema (IA + reglas)**");
      lines.push("");
      if (!turn.ai.ok) {
        lines.push(`Error: ${turn.ai.error}`);
      } else {
        lines.push(`- Resultado: **${turn.ai.kind}**`);
        lines.push(`- Modelo: ${turn.ai.model} · Prompt: ${turn.ai.promptVersion}`);
        lines.push(`- Modelo sugería: ${turn.ai.modelSuggestedKind}`);
        if (turn.ai.appliedRuleIds.length > 0) {
          lines.push(`- Reglas aplicadas: ${turn.ai.appliedRuleIds.join(", ")}`);
        }
        if (turn.ai.kind === "reply" && turn.ai.draftReply) {
          lines.push("");
          lines.push("Borrador:");
          lines.push("");
          lines.push("```");
          lines.push(turn.ai.draftReply.slice(0, 4000));
          lines.push("```");
        }
        if (turn.ai.kind === "handoff") {
          lines.push(`- Motivo: ${turn.ai.reason ?? ""}`);
          if (turn.ai.summaryForHuman) {
            lines.push(`- Resumen: ${turn.ai.summaryForHuman}`);
          }
        }
        if (turn.ai.kind === "noop") {
          lines.push(`- Motivo: ${turn.ai.reason}`);
        }
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  if (p.followUpLab) {
    lines.push(`## Seguimiento (tick de laboratorio)`);
    lines.push("");
    if (!p.followUpLab.ok) {
      lines.push(`Omitido: ${p.followUpLab.reason}`);
    } else {
      lines.push(`- Plan: ${p.followUpLab.planName} (\`${p.followUpLab.planId}\`)`);
      lines.push(`- Secuencia: \`${p.followUpLab.sequenceId}\``);
      lines.push(
        `- Cron: examinadas ${p.followUpLab.cron.sequencesExamined}, intentos ${p.followUpLab.cron.attemptsCreated}, omitidas ${p.followUpLab.cron.skipped}`,
      );
      if (p.followUpLab.firstAttempt) {
        lines.push(
          `- Primer intento: paso ${p.followUpLab.firstAttempt.step} · canal ${p.followUpLab.firstAttempt.channel} · outcome \`${p.followUpLab.firstAttempt.outcome ?? "null"}\``,
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
