import Papa from "papaparse";
import type { MetricRow, ObjectiveType, RawRow, ReportLevel } from "@/lib/types";

const columnMap = {
  periodStart: ["Início dos relatórios"],
  periodEnd: ["Encerramento dos relatórios"],
  campaignName: ["Nome da campanha"],
  adsetName: ["Nome do conjunto de anúncios"],
  adName: ["Nome do anúncio"],
  campaignStatus: ["Veiculação da campanha"],
  adsetStatus: ["Veiculação do conjunto de anúncios"],
  adStatus: ["Veiculação de anúncio"],
  spend: ["Valor usado (BRL)"],
  results: ["Resultados"],
  resultIndicator: ["Indicador de resultados"],
  costPerResult: ["Custo por resultados"],
  impressions: ["Impressões"],
  reach: ["Alcance"],
  frequency: ["Frequência"],
  cpm: ["CPM (custo por 1.000 impressões) (BRL)"],
  linkClicks: ["Cliques no link"],
  purchases: ["Compras", "Compras no site"],
  checkouts: [
    "Finalizações de compra iniciadas",
    "Finalizações da compra iniciadas no site",
  ],
  landingPageViews: [
    "Visualizações da página de destino",
    "Visualizações da página de destino do site",
  ],
  roas: [
    "ROAS (retorno sobre o investimento em publicidade) das compras",
    "ROAS de resultados",
  ],
  profit: ["GRANA NO BOLSO"],
  qualityRanking: ["Classificação de qualidade"],
  engagementRanking: ["Classificação da taxa de engajamento"],
  conversionRanking: ["Classificação da taxa de conversão"],
};

function valueFor(row: RawRow, keys: string[]) {
  const key = keys.find((candidate) => candidate in row);
  return key ? row[key] : null;
}

function text(row: RawRow, keys: string[]) {
  const value = valueFor(row, keys);
  return value === null || value === undefined ? "" : String(value).trim();
}

function number(row: RawRow, keys: string[]) {
  const value = valueFor(row, keys);
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace(/^R\$/i, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const normalized = hasComma
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : hasDot
      ? cleaned
      : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function detectLevel(columns: string[]): ReportLevel {
  if (columns.includes("Nome do anúncio")) return "ad";
  if (columns.includes("Nome do conjunto de anúncios")) return "adset";
  return "campaign";
}

export function inferObjective(indicator: string, name: string): ObjectiveType {
  const haystack = `${indicator} ${name}`.toLowerCase();
  if (haystack.includes("purchase") || haystack.includes("compra")) return "sales";
  if (haystack.includes("lead") || haystack.includes("forms") || haystack.includes("form")) return "lead";
  if (
    haystack.includes("messaging") ||
    haystack.includes("whats") ||
    haystack.includes("wpp") ||
    haystack.includes("mensagem")
  ) {
    return "message";
  }
  if (haystack.includes("post_engagement") || haystack.includes("[eng]")) return "engagement";
  if (haystack.includes("reach") || haystack.includes("alcance")) return "reach";
  if (haystack.includes("trafego") || haystack.includes("tráfego")) return "traffic";
  return "unknown";
}

function normalizeRawRow(input: Record<string, unknown>): RawRow {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key.trim(),
      value === "" || value === undefined ? null : (value as string | number | null),
    ]),
  );
}

export async function parseSpreadsheet(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      defval: null,
    });
    const columns = Object.keys(rows[0] ?? {});
    return { rows: rows.map(normalizeRawRow), columns };
  }

  const textContent = await file.text();
  const result = Papa.parse<Record<string, unknown>>(textContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length) {
    throw new Error(result.errors[0]?.message ?? "Não consegui ler o CSV.");
  }

  return {
    rows: result.data.map(normalizeRawRow),
    columns: result.meta.fields ?? Object.keys(result.data[0] ?? {}),
  };
}

export function normalizeMetricRows(
  rows: RawRow[],
  importId: string,
  clientId: string,
  level: ReportLevel,
): MetricRow[] {
  return rows.map((row, index) => {
    const entityName =
      level === "ad"
        ? text(row, columnMap.adName)
        : level === "adset"
          ? text(row, columnMap.adsetName)
          : text(row, columnMap.campaignName);
    const parentName =
      level === "ad" ? text(row, columnMap.adsetName) : text(row, columnMap.campaignName);
    const resultIndicator = text(row, columnMap.resultIndicator);
    const spend = number(row, columnMap.spend);
    const profit = number(row, columnMap.profit);
    const roas = number(row, columnMap.roas);
    const revenue = profit ? spend + profit : roas ? spend * roas : 0;

    return {
      id: `${importId}-${index}`,
      importId,
      clientId,
      level,
      entityName: entityName || `Linha ${index + 1}`,
      parentName: parentName || undefined,
      periodStart: text(row, columnMap.periodStart) || undefined,
      periodEnd: text(row, columnMap.periodEnd) || undefined,
      status:
        text(row, columnMap.campaignStatus) ||
        text(row, columnMap.adsetStatus) ||
        text(row, columnMap.adStatus) ||
        undefined,
      resultIndicator: resultIndicator || undefined,
      objective: inferObjective(resultIndicator, `${entityName} ${parentName}`),
      raw: row,
      spend,
      results: number(row, columnMap.results),
      costPerResult: number(row, columnMap.costPerResult),
      impressions: number(row, columnMap.impressions),
      reach: number(row, columnMap.reach),
      frequency: number(row, columnMap.frequency),
      cpm: number(row, columnMap.cpm),
      linkClicks: number(row, columnMap.linkClicks),
      purchases: number(row, columnMap.purchases),
      checkouts: number(row, columnMap.checkouts),
      landingPageViews: number(row, columnMap.landingPageViews),
      roas,
      profit,
      revenue,
      qualityRanking: text(row, columnMap.qualityRanking) || undefined,
      engagementRanking: text(row, columnMap.engagementRanking) || undefined,
      conversionRanking: text(row, columnMap.conversionRanking) || undefined,
    };
  });
}
