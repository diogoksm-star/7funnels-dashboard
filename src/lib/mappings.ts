import type { EntityMapping, MetricRow } from "@/lib/types";

export function mappingKey(level: string, originalName: string, parentName?: string) {
  return `${level}::${originalName.trim()}::${parentName?.trim() ?? ""}`;
}

export function applyMappings(rows: MetricRow[], mappings: EntityMapping[]) {
  const map = new Map(
    mappings.map((mapping) => [
      mappingKey(mapping.level, mapping.originalName, mapping.parentName),
      mapping,
    ]),
  );

  return rows.map((row) => {
    const mapping = map.get(mappingKey(row.level, row.entityName, row.parentName));
    if (!mapping) return row;

    return {
      ...row,
      entityName: mapping.friendlyName?.trim() || row.entityName,
      objective: mapping.manualObjective || row.objective,
      raw: {
        ...row.raw,
        "Nome amigável": mapping.friendlyName ?? null,
        "Tipo manual": mapping.type ?? null,
        "Tag principal": mapping.mainTag ?? null,
        "Observação": mapping.notes ?? null,
        "Tipo de criativo": mapping.creativeType ?? null,
        "Ângulo": mapping.creativeAngle ?? null,
        "Oferta": mapping.offer ?? null,
        "Status criativo": mapping.creativeStatus ?? null,
        "Região": mapping.audienceRegion ?? null,
        "Idade": mapping.audienceAge ?? null,
        "Gênero": mapping.audienceGender ?? null,
        "Temperatura": mapping.audienceTemperature ?? null,
        "Tipo de público": mapping.audienceType ?? null,
      },
    };
  });
}
