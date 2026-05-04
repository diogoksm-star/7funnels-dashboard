import type { GoalSettings, MetricRow, ObjectiveType, ReportLevel, SummaryMetrics } from "@/lib/types";

export const objectiveLabels: Record<ObjectiveType, string> = {
  sales: "Vendas",
  lead: "Leads",
  message: "Mensagens",
  engagement: "Engajamento",
  reach: "Alcance",
  traffic: "Tráfego",
  unknown: "Não classificado",
};

export const levelLabels: Record<ReportLevel, string> = {
  campaign: "Campanhas",
  adset: "Públicos",
  ad: "Criativos",
};

export function safeDiv(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function summarize(rows: MetricRow[]): SummaryMetrics {
  const spend = sum(rows, "spend");
  const results = sum(rows, "results");
  const purchases = sum(rows, "purchases");
  const leads = sum(rows.filter((row) => row.objective === "lead"), "results");
  const messages = sum(rows.filter((row) => row.objective === "message"), "results");
  const revenue = sum(rows, "revenue");
  const profit = sum(rows, "profit");
  const impressions = sum(rows, "impressions");
  const reach = sum(rows, "reach");
  const linkClicks = sum(rows, "linkClicks");
  const checkouts = sum(rows, "checkouts");
  const landingPageViews = sum(rows, "landingPageViews");

  return {
    spend,
    results,
    purchases,
    leads,
    messages,
    revenue,
    profit,
    impressions,
    reach,
    linkClicks,
    checkouts,
    landingPageViews,
    cpa: safeDiv(spend, purchases),
    cpl: safeDiv(sum(rows.filter((row) => row.objective === "lead"), "spend"), leads),
    costPerMessage: safeDiv(sum(rows.filter((row) => row.objective === "message"), "spend"), messages),
    roas: safeDiv(revenue, spend),
    cpm: safeDiv(spend, impressions) * 1000,
    cpc: safeDiv(spend, linkClicks),
    ctr: safeDiv(linkClicks, impressions) * 100,
    frequency: safeDiv(impressions, reach),
  };
}

export function sum(rows: MetricRow[], key: keyof MetricRow) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

export function groupRows(rows: MetricRow[], getKey: (row: MetricRow) => string) {
  const groups = new Map<string, MetricRow[]>();
  rows.forEach((row) => {
    const key = getKey(row) || "Não classificado";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  return [...groups.entries()].map(([name, group]) => ({
    name,
    rows: group,
    summary: summarize(group),
  }));
}

export function rankRows(rows: MetricRow[], metric: keyof MetricRow, direction: "asc" | "desc" = "desc") {
  return [...rows].sort((a, b) => {
    const left = Number(a[metric]) || 0;
    const right = Number(b[metric]) || 0;
    return direction === "desc" ? right - left : left - right;
  });
}

export function buildAlerts(rows: MetricRow[], goals: GoalSettings) {
  const alerts: { title: string; detail: string; tone: "bad" | "warn" | "good" }[] = [];
  const spendWithoutResult = goals.maxSpendWithoutResult ?? 100;
  const maxFrequency = goals.maxFrequency ?? 2.5;

  rows.forEach((row) => {
    if (row.spend >= spendWithoutResult && row.results <= 0) {
      alerts.push({
        title: "Gasto sem resultado",
        detail: `${row.entityName} gastou ${row.spend.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem resultado registrado.`,
        tone: "bad",
      });
    }
    if (row.objective === "sales" && goals.targetRoas && row.roas > 0 && row.roas < goals.targetRoas) {
      alerts.push({
        title: "ROAS abaixo da meta",
        detail: `${row.entityName} está com ROAS ${row.roas.toFixed(2)} contra meta ${goals.targetRoas.toFixed(2)}.`,
        tone: "warn",
      });
    }
    if (row.objective === "lead" && goals.maxCpl && row.costPerResult > goals.maxCpl) {
      alerts.push({
        title: "Lead caro",
        detail: `${row.entityName} está com CPL de ${row.costPerResult.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
        tone: "warn",
      });
    }
    if (row.objective === "message" && goals.maxCostPerMessage && row.costPerResult > goals.maxCostPerMessage) {
      alerts.push({
        title: "Conversa cara",
        detail: `${row.entityName} está com custo por conversa acima da meta.`,
        tone: "warn",
      });
    }
    if (row.frequency > maxFrequency && row.spend > 0) {
      alerts.push({
        title: "Frequência alta",
        detail: `${row.entityName} tem frequência ${row.frequency.toFixed(2)}. Vale checar saturação.`,
        tone: "warn",
      });
    }
    if (
      row.level === "ad" &&
      [row.qualityRanking, row.engagementRanking, row.conversionRanking].some((item) =>
        item?.toLowerCase().includes("abaixo"),
      )
    ) {
      alerts.push({
        title: "Criativo com ranking baixo",
        detail: `${row.entityName} tem classificação abaixo da média em qualidade, engajamento ou conversão.`,
        tone: "warn",
      });
    }
  });

  return alerts.slice(0, 12);
}
