"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  Eye,
  Filter,
  Goal,
  Megaphone,
  MousePointerClick,
  Target,
  Users,
} from "lucide-react";
import { buildAlerts, groupRows, levelLabels, objectiveLabels, rankRows, summarize } from "@/lib/analytics";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { ClientDashboard, MetricRow } from "@/lib/types";
import { MetricCard } from "@/components/metric-card";

type DashboardProps = {
  client: ClientDashboard;
  rows: MetricRow[];
};

const ObjectiveChart = dynamic(() => import("@/components/objective-chart"), {
  ssr: false,
  loading: () => <div className="h-full rounded-md border border-white/10 bg-black/20" />,
});

export function Dashboard({ client, rows }: DashboardProps) {
  const summary = summarize(rows);
  const alerts = buildAlerts(rows, client.goals);
  const objectiveGroups = groupRows(rows, (row) => objectiveLabels[row.objective]);
  const campaignRows = rows.filter((row) => row.level === "campaign");
  const adsetRows = rows.filter((row) => row.level === "adset");
  const adRows = rows.filter((row) => row.level === "ad");
  const topSpend = rankRows(rows, "spend").slice(0, 8);
  const hasSales = rows.some((row) => row.purchases > 0 || row.profit !== 0 || row.roas > 0);
  const activeObjectiveCount = objectiveGroups.filter((group) => group.summary.results > 0).length;
  const kpiCards = [
    {
      label: "Gasto total",
      value: formatCurrency(summary.spend),
      icon: <CircleDollarSign size={18} />,
    },
    {
      label: "Objetivos ativos",
      value: formatNumber(activeObjectiveCount),
      detail: "Resultados ficam separados por objetivo",
      icon: <Goal size={18} />,
    },
    campaignRows.length
      ? {
          label: "Campanhas",
          value: formatNumber(campaignRows.length),
          detail: "Linhas no nível campanha",
          icon: <Target size={18} />,
        }
      : null,
    summary.purchases > 0
      ? {
          label: "Compras",
          value: formatNumber(summary.purchases),
          detail: `CPA médio ${formatCurrency(summary.cpa)}`,
          icon: <Target size={18} />,
        }
      : null,
    summary.leads > 0
      ? {
          label: "Leads",
          value: formatNumber(summary.leads),
          detail: `CPL ${formatCurrency(summary.cpl)}`,
          icon: <Users size={18} />,
        }
      : null,
    summary.messages > 0
      ? {
          label: "Mensagens",
          value: formatNumber(summary.messages),
          detail: `Custo/conversa ${formatCurrency(summary.costPerMessage)}`,
          icon: <Megaphone size={18} />,
        }
      : null,
    summary.linkClicks > 0
      ? {
          label: "Cliques no link",
          value: formatNumber(summary.linkClicks),
          detail: `CPC ${formatCurrency(summary.cpc)}${summary.impressions > 0 ? ` | CTR ${formatPercent(summary.ctr)}` : ""}`,
          icon: <MousePointerClick size={18} />,
        }
      : null,
    summary.impressions > 0
      ? {
          label: "Impressões",
          value: formatNumber(summary.impressions),
          detail: `CPM ${formatCurrency(summary.cpm)} | Frequência ${formatNumber(summary.frequency, 2)}`,
          icon: <Eye size={18} />,
        }
      : null,
    hasSales
      ? {
          label: "Lucro / ROAS",
          value: formatCurrency(summary.profit),
          detail: `ROAS ${formatNumber(summary.roas, 2)} | Receita ${formatCurrency(summary.revenue)}`,
          tone: summary.profit > 0 ? ("good" as const) : ("bad" as const),
          icon: <BarChart3 size={18} />,
        }
      : null,
  ].filter((card) => card !== null);

  return (
    <div className="min-h-screen bg-[#080A0F] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0B0E14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Facebook Ads Report</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">{client.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">{client.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="rounded-md border border-white/10 px-3 py-2">/{client.slug}</span>
            <span className="rounded-md border border-white/10 px-3 py-2">{rows.length} linhas importadas</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {rows.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <div className="space-y-8">
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((card) => (
                <MetricCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  detail={card.detail}
                  tone={card.tone}
                  icon={card.icon}
                />
              ))}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Resultados por objetivo</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Compras, leads, mensagens e outros eventos não são somados como um único KPI porque cada um mede uma ação diferente.
                </p>
              </div>
              <GroupBlock title="Objetivos" groups={objectiveGroups} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Distribuição por objetivo</h2>
                  <p className="text-sm text-zinc-500">Gasto e resultado agregados pelo objetivo detectado.</p>
                  </div>
                  <Filter className="text-zinc-500" size={18} />
                </div>
                <div className="h-72">
                  <ObjectiveChart data={objectiveGroups.map((group) => ({ name: group.name, gasto: group.summary.spend, resultados: group.summary.results }))} />
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-300" size={18} />
                  <h2 className="text-lg font-semibold">Alertas</h2>
                </div>
                <div className="space-y-3">
                  {alerts.length ? (
                    alerts.map((alert, index) => (
                      <div key={`${alert.title}-${index}`} className="rounded-md border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="mt-1 text-sm text-zinc-400">{alert.detail}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">Sem alertas relevantes com as metas atuais.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 p-4">
                <h2 className="text-lg font-semibold">Leituras detalhadas</h2>
                <p className="mt-1 text-sm text-zinc-500">As abas aparecem mesmo quando não há dados, para deixar claro o que falta importar.</p>
              </div>
              <div className="p-4">
                <div className="grid gap-4">
                  <DetailBlock title="Maiores gastos" rows={topSpend} />
                  <DetailBlock title="Campanhas" rows={campaignRows} empty="Importe uma planilha no nível Campanhas." />
                  <DetailBlock title="Públicos / Conjuntos" rows={adsetRows} empty="Importe uma planilha no nível Conjuntos de anúncios." />
                  <DetailBlock title="Criativos / Anúncios" rows={adRows} empty="Importe uma planilha no nível Anúncios." showCreative />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-10 text-center">
      <Activity className="mx-auto text-zinc-500" size={32} />
      <h2 className="mt-4 text-xl font-semibold">Dashboard pronto para receber dados</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-500">
        Entre no admin, cadastre o cliente e importe CSVs de campanhas, públicos e criativos. O painel público atualiza automaticamente.
      </p>
    </div>
  );
}

function DetailBlock({
  title,
  rows,
  empty = "Sem dados para esta visão.",
  showCreative = false,
}: {
  title: string;
  rows: MetricRow[];
  empty?: string;
  showCreative?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-zinc-500">{rows.length} linhas</span>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Nível</th>
                <th className="px-4 py-3">Objetivo</th>
                <th className="px-4 py-3">Gasto</th>
                <th className="px-4 py-3">Resultado do objetivo</th>
                <th className="px-4 py-3">Custo/resultado</th>
                <th className="px-4 py-3">Cliques</th>
                <th className="px-4 py-3">CPM</th>
                {showCreative ? <th className="px-4 py-3">Ranking</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.slice(0, 12).map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  <td className="max-w-md px-4 py-3 text-zinc-200">{row.entityName}</td>
                  <td className="px-4 py-3 text-zinc-400">{levelLabels[row.level]}</td>
                  <td className="px-4 py-3 text-zinc-400">{objectiveLabels[row.objective]}</td>
                  <td className="px-4 py-3">{formatCurrency(row.spend)}</td>
                  <td className="px-4 py-3">{formatNumber(row.results)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.costPerResult)}</td>
                  <td className="px-4 py-3">{formatNumber(row.linkClicks)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.cpm)}</td>
                  {showCreative ? (
                    <td className="max-w-xs px-4 py-3 text-zinc-500">
                      {[row.qualityRanking, row.engagementRanking, row.conversionRanking].filter(Boolean).join(" / ") || "Sem ranking"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-zinc-500">{empty}</p>
      )}
    </div>
  );
}

function GroupBlock({ title, groups }: { title: string; groups: ReturnType<typeof groupRows> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((group) => (
        <div key={group.name} className="rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-zinc-400">{title}: {group.name}</p>
          <p className="mt-3 text-xl font-semibold">{formatCurrency(group.summary.spend)}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatNumber(group.summary.results)} resultados desse objetivo em {group.rows.length} linhas
          </p>
        </div>
      ))}
    </div>
  );
}
