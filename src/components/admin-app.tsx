"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  KeyRound,
  Link2,
  ListChecks,
  LockKeyhole,
  RotateCcw,
  Save,
  Settings2,
  Tags,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { SupabaseStatus } from "@/components/supabase-status";
import { demoState } from "@/lib/demo-data";
import { detectLevel, normalizeMetricRows, parseSpreadsheet } from "@/lib/parser";
import { formatCurrency, slugify } from "@/lib/format";
import { loadState, saveState } from "@/lib/local-store";
import { applyMappings, mappingKey } from "@/lib/mappings";
import type { AppState, ClientDashboard, EntityMapping, ObjectiveType, ReportLevel } from "@/lib/types";

type AdminStep = "clients" | "import" | "imports" | "nomenclature" | "goals" | "data" | "preview";

const adminPassword = "admin123";

const steps: { id: AdminStep; label: string; description: string; icon: typeof Users }[] = [
  { id: "clients", label: "Clientes", description: "Criar e selecionar dashboards", icon: Users },
  { id: "import", label: "Importar", description: "Subir CSV/XLSX do Meta Ads", icon: Upload },
  { id: "imports", label: "Importações", description: "Ver arquivos já lidos", icon: ListChecks },
  { id: "nomenclature", label: "Nomenclatura", description: "Ensinar nomes, tags e tipos", icon: Tags },
  { id: "goals", label: "Metas", description: "Configurações manuais", icon: Settings2 },
  { id: "data", label: "Dados", description: "Limpar, apagar e restaurar", icon: Trash2 },
  { id: "preview", label: "Preview", description: "Ver dashboard do cliente", icon: BarChart3 },
];

export function AdminApp() {
  const [authorized, setAuthorized] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem("ads-admin-auth") === "ok",
  );
  const [state, setState] = useState<AppState>(() => loadState());
  const [selectedClientId, setSelectedClientId] = useState(() => loadState().clients[0]?.id ?? "");
  const [activeStep, setActiveStep] = useState<AdminStep>("clients");
  const [message, setMessage] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const selectedClient = state.clients.find((client) => client.id === selectedClientId);
  const selectedRows = useMemo(
    () => state.rows.filter((row) => row.clientId === selectedClientId),
    [state.rows, selectedClientId],
  );
  const selectedMappings = useMemo(
    () => state.mappings.filter((mapping) => mapping.clientId === selectedClientId),
    [state.mappings, selectedClientId],
  );
  const mappedRows = useMemo(
    () => applyMappings(selectedRows, selectedMappings),
    [selectedRows, selectedMappings],
  );
  const selectedImports = useMemo(
    () => state.imports.filter((item) => item.clientId === selectedClientId),
    [state.imports, selectedClientId],
  );

  function updateState(next: AppState) {
    setState(next);
  }

  function login(formData: FormData) {
    const password = String(formData.get("adminPassword") ?? "");
    if (password !== adminPassword) {
      setMessage("Senha do admin incorreta.");
      return;
    }
    window.sessionStorage.setItem("ads-admin-auth", "ok");
    setAuthorized(true);
    setMessage("");
  }

  function logout() {
    window.sessionStorage.removeItem("ads-admin-auth");
    setAuthorized(false);
    setMessage("");
  }

  function createClient(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const slug = slugify(String(formData.get("slug") || name));
    const client: ClientDashboard = {
      id: crypto.randomUUID(),
      name,
      slug,
      password: String(formData.get("password") || slug),
      subtitle: String(formData.get("subtitle") || "Relatorio visual de midia paga"),
      createdAt: new Date().toISOString(),
      goals: {
        targetRoas: Number(formData.get("targetRoas")) || undefined,
        maxCpa: Number(formData.get("maxCpa")) || undefined,
        maxCpl: Number(formData.get("maxCpl")) || undefined,
        maxCostPerMessage: Number(formData.get("maxCostPerMessage")) || undefined,
        maxSpendWithoutResult: Number(formData.get("maxSpendWithoutResult")) || 100,
        maxFrequency: Number(formData.get("maxFrequency")) || 2.5,
      },
    };
    updateState({ ...state, clients: [...state.clients, client] });
    setSelectedClientId(client.id);
    setMessage(`Cliente ${client.name} criado.`);
  }

  function updateSelectedClientGoals(formData: FormData) {
    if (!selectedClient) return;
    const updated: ClientDashboard = {
      ...selectedClient,
      goals: {
        targetRoas: Number(formData.get("targetRoas")) || undefined,
        maxCpa: Number(formData.get("maxCpa")) || undefined,
        maxCpl: Number(formData.get("maxCpl")) || undefined,
        maxCostPerMessage: Number(formData.get("maxCostPerMessage")) || undefined,
        maxSpendWithoutResult: Number(formData.get("maxSpendWithoutResult")) || undefined,
        maxFrequency: Number(formData.get("maxFrequency")) || undefined,
        minCtr: Number(formData.get("minCtr")) || undefined,
        expectedLeadValue: Number(formData.get("expectedLeadValue")) || undefined,
        closeRate: Number(formData.get("closeRate")) || undefined,
      },
    };
    updateState({
      ...state,
      clients: state.clients.map((client) => (client.id === updated.id ? updated : client)),
    });
    setMessage(`Metas de ${updated.name} atualizadas.`);
  }

  function saveEntityMapping(formData: FormData) {
    if (!selectedClient) return;
    const level = String(formData.get("level")) as ReportLevel;
    const originalName = String(formData.get("originalName") ?? "");
    const parentName = String(formData.get("parentName") ?? "") || undefined;
    const existingKey = mappingKey(level, originalName, parentName);
    const existing = state.mappings.find(
      (mapping) => mapping.clientId === selectedClient.id && mappingKey(mapping.level, mapping.originalName, mapping.parentName) === existingKey,
    );

    const next: EntityMapping = {
      id: existing?.id ?? crypto.randomUUID(),
      clientId: selectedClient.id,
      level,
      originalName,
      parentName,
      friendlyName: String(formData.get("friendlyName") ?? "").trim() || undefined,
      manualObjective: (String(formData.get("manualObjective") ?? "") || undefined) as ObjectiveType | undefined,
      type: String(formData.get("type") ?? "").trim() || undefined,
      mainTag: String(formData.get("mainTag") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      creativeType: String(formData.get("creativeType") ?? "").trim() || undefined,
      creativeAngle: String(formData.get("creativeAngle") ?? "").trim() || undefined,
      offer: String(formData.get("offer") ?? "").trim() || undefined,
      creativeStatus: String(formData.get("creativeStatus") ?? "").trim() || undefined,
      audienceRegion: String(formData.get("audienceRegion") ?? "").trim() || undefined,
      audienceAge: String(formData.get("audienceAge") ?? "").trim() || undefined,
      audienceGender: String(formData.get("audienceGender") ?? "").trim() || undefined,
      audienceTemperature: String(formData.get("audienceTemperature") ?? "").trim() || undefined,
      audienceType: String(formData.get("audienceType") ?? "").trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    updateState({
      ...state,
      mappings: [
        ...state.mappings.filter(
          (mapping) =>
            !(
              mapping.clientId === selectedClient.id &&
              mappingKey(mapping.level, mapping.originalName, mapping.parentName) === existingKey
            ),
        ),
        next,
      ],
    });
    setMessage(`Nomenclatura salva para ${next.friendlyName || next.originalName}.`);
  }

  async function importFile(file: File) {
    if (!selectedClient) return;
    try {
      const parsed = await parseSpreadsheet(file);
      const level = detectLevel(parsed.columns);
      const importId = crypto.randomUUID();
      const rows = normalizeMetricRows(parsed.rows, importId, selectedClient.id, level);
      const importRecord = {
        id: importId,
        clientId: selectedClient.id,
        fileName: file.name,
        level,
        periodStart: rows[0]?.periodStart,
        periodEnd: rows[0]?.periodEnd,
        importedAt: new Date().toISOString(),
        rowCount: rows.length,
        columns: parsed.columns,
      };
      updateState({
        ...state,
        imports: [...state.imports, importRecord],
        rows: [...state.rows, ...rows],
      });
      setMessage(`${file.name} importado como ${level}. ${rows.length} linhas salvas.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao importar arquivo.");
    }
  }

  function clearSelectedClientData() {
    if (!selectedClient) return;
    const ok = window.confirm(
      `Apagar todas as importacoes e metricas de ${selectedClient.name}? O cliente continua cadastrado.`,
    );
    if (!ok) return;
    updateState({
      ...state,
      imports: state.imports.filter((item) => item.clientId !== selectedClient.id),
      rows: state.rows.filter((row) => row.clientId !== selectedClient.id),
      mappings: state.mappings,
    });
    setMessage(`Dados de ${selectedClient.name} apagados.`);
  }

  function deleteSelectedClient() {
    if (!selectedClient) return;
    const ok = window.confirm(
      `Apagar o cliente ${selectedClient.name}, senha, importacoes e metricas? Essa acao remove o dashboard /${selectedClient.slug}.`,
    );
    if (!ok) return;
    const clients = state.clients.filter((client) => client.id !== selectedClient.id);
    updateState({
      clients,
      imports: state.imports.filter((item) => item.clientId !== selectedClient.id),
      rows: state.rows.filter((row) => row.clientId !== selectedClient.id),
      mappings: state.mappings.filter((mapping) => mapping.clientId !== selectedClient.id),
    });
    setSelectedClientId(clients[0]?.id ?? "");
    setMessage(`Cliente ${selectedClient.name} apagado.`);
  }

  function resetEverything() {
    const ok = window.confirm(
      "Apagar todos os clientes, senhas locais, importacoes e metricas deste navegador?",
    );
    if (!ok) return;
    updateState({ clients: [], imports: [], rows: [], mappings: [] });
    setSelectedClientId("");
    setMessage("Tudo foi apagado. Voce pode cadastrar um cliente novo agora.");
  }

  function restoreDemoData() {
    updateState(demoState);
    setSelectedClientId(demoState.clients[0]?.id ?? "");
    setMessage("Dados demo restaurados.");
  }

  if (!authorized) {
    return <AdminLogin message={message} onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-[#080A0F] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0B0E14]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Admin protegido</p>
            <h1 className="mt-2 text-3xl font-semibold">Gerador de relatorios Facebook Ads</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Etapas internas para criar dashboards, importar planilhas, configurar metas e gerenciar dados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SupabaseStatus />
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"
            >
              Sair do admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-medium uppercase text-zinc-500">Etapas do admin</p>
            <div className="mt-3 grid gap-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const active = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left ${
                      active
                        ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon size={18} />
                    <span>
                      <span className="block text-sm font-semibold">{step.label}</span>
                      <span className="block text-xs text-zinc-500">{step.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <ClientSelector
            clients={state.clients}
            selectedClientId={selectedClientId}
            selectedClient={selectedClient}
            selectedRows={selectedRows}
            onSelect={setSelectedClientId}
          />

          {message ? (
            <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
              {message}
            </section>
          ) : null}
        </aside>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          {activeStep === "clients" ? <ClientsStep onCreateClient={createClient} /> : null}
          {activeStep === "import" ? (
            <ImportStep selectedClient={selectedClient} onImportFile={importFile} />
          ) : null}
          {activeStep === "imports" ? (
            <ImportsStep selectedClient={selectedClient} imports={selectedImports} rows={selectedRows} />
          ) : null}
          {activeStep === "nomenclature" ? (
            <NomenclatureStep
              selectedClient={selectedClient}
              rows={selectedRows}
              mappings={selectedMappings}
              onSave={saveEntityMapping}
            />
          ) : null}
          {activeStep === "goals" ? (
            <GoalsStep selectedClient={selectedClient} onSave={updateSelectedClientGoals} />
          ) : null}
          {activeStep === "data" ? (
            <DataStep
              selectedClient={selectedClient}
              onClearClientData={clearSelectedClientData}
              onDeleteClient={deleteSelectedClient}
              onResetEverything={resetEverything}
              onRestoreDemo={restoreDemoData}
            />
          ) : null}
          {activeStep === "preview" ? (
            selectedClient ? (
              <Dashboard client={selectedClient} rows={mappedRows} />
            ) : (
              <EmptyPanel title="Nenhum cliente selecionado" body="Cadastre ou selecione um cliente para ver o preview." />
            )
          ) : null}
        </section>
      </main>
    </div>
  );
}

function AdminLogin({ message, onLogin }: { message: string; onLogin: (formData: FormData) => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080A0F] px-5 text-zinc-100">
      <form action={onLogin} className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <LockKeyhole className="text-cyan-300" size={28} />
        <h1 className="mt-4 text-2xl font-semibold">Acesso admin</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Area interna para cadastrar clientes, importar planilhas e apagar dados.
        </p>
        <label className="mt-6 block">
          <span className="text-sm text-zinc-400">Senha do admin</span>
          <input
            name="adminPassword"
            type="password"
            placeholder="admin123"
            className="mt-2 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 py-2 outline-none placeholder:text-zinc-700 focus:border-cyan-300/70"
            autoFocus
          />
        </label>
        <button className="mt-4 w-full rounded-md bg-cyan-300 px-3 py-2 font-semibold text-slate-950 hover:bg-cyan-200">
          Entrar no admin
        </button>
        {message ? <p className="mt-3 text-sm text-rose-200">{message}</p> : null}
      </form>
    </div>
  );
}

function ClientSelector({
  clients,
  selectedClientId,
  selectedClient,
  selectedRows,
  onSelect,
}: {
  clients: ClientDashboard[];
  selectedClientId: string;
  selectedClient?: ClientDashboard;
  selectedRows: { spend: number }[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <label className="text-sm text-zinc-400">Cliente selecionado</label>
      <select
        value={selectedClientId}
        onChange={(event) => onSelect(event.target.value)}
        className="mt-2 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 py-2 text-sm outline-none"
      >
        {clients.length === 0 ? <option value="">Nenhum cliente cadastrado</option> : null}
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      {selectedClient ? (
        <div className="mt-4 space-y-2 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
          <p className="flex items-center gap-2">
            <Link2 size={14} /> /{selectedClient.slug}
          </p>
          <p className="flex items-center gap-2">
            <KeyRound size={14} /> {selectedClient.password}
          </p>
          <p>
            {selectedRows.length} linhas salvas |{" "}
            {formatCurrency(selectedRows.reduce((total, row) => total + row.spend, 0))}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ClientsStep({ onCreateClient }: { onCreateClient: (formData: FormData) => void }) {
  return (
    <Panel title="Clientes e dashboards" body="Crie o dashboard de cada cliente com slug e senha propria.">
      <form action={onCreateClient} className="grid gap-3 md:grid-cols-2">
        <Input name="name" label="Nome" placeholder="Cliente 01" />
        <Input name="slug" label="URL slug" placeholder="cliente01" />
        <Input name="password" label="Senha do dashboard" placeholder="cliente01" />
        <Input name="subtitle" label="Subheadline" placeholder="Resumo mensal de performance" />
        <Input name="targetRoas" label="ROAS meta" placeholder="1.2" />
        <Input name="maxCpa" label="CPA max." placeholder="90" />
        <Input name="maxCpl" label="CPL max." placeholder="30" />
        <Input name="maxCostPerMessage" label="Msg max." placeholder="15" />
        <button className="flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 md:col-span-2">
          <Save size={16} />
          Salvar cliente
        </button>
      </form>
    </Panel>
  );
}

function ImportStep({
  selectedClient,
  onImportFile,
}: {
  selectedClient?: ClientDashboard;
  onImportFile: (file: File) => void;
}) {
  return (
    <Panel title="Importar planilha" body="Suba arquivos de campanhas, conjuntos de anuncios ou anuncios.">
      {selectedClient ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-14 text-center hover:border-cyan-300/60">
          <FileSpreadsheet className="text-zinc-500" size={34} />
          <span className="mt-3 text-sm font-medium">CSV ou XLSX para {selectedClient.name}</span>
          <span className="mt-1 text-xs text-zinc-500">O sistema detecta campanha, publico/conjunto ou criativo/anuncio.</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      ) : (
        <EmptyPanel title="Selecione um cliente" body="Crie ou selecione um cliente antes de importar planilhas." />
      )}
    </Panel>
  );
}

function ImportsStep({
  selectedClient,
  imports,
  rows,
}: {
  selectedClient?: ClientDashboard;
  imports: AppState["imports"];
  rows: AppState["rows"];
}) {
  return (
    <Panel title="Importacoes salvas" body="Confira os arquivos lidos e o volume de dados do cliente.">
      {selectedClient ? (
        <div className="grid gap-3">
          {imports.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">{item.fileName}</p>
              <p className="mt-1">
                {item.level} | {item.rowCount} linhas | {item.periodStart ?? "sem inicio"} a {item.periodEnd ?? "sem fim"}
              </p>
              <p className="mt-2 text-xs text-zinc-600">{item.columns.length} colunas detectadas</p>
            </div>
          ))}
          {imports.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma importacao salva para este cliente.</p> : null}
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            Total atual: {rows.length} linhas normalizadas.
          </div>
        </div>
      ) : (
        <EmptyPanel title="Nenhum cliente selecionado" body="Selecione um cliente para ver importacoes." />
      )}
    </Panel>
  );
}

function NomenclatureStep({
  selectedClient,
  rows,
  mappings,
  onSave,
}: {
  selectedClient?: ClientDashboard;
  rows: AppState["rows"];
  mappings: EntityMapping[];
  onSave: (formData: FormData) => void;
}) {
  const [level, setLevel] = useState<ReportLevel>("campaign");
  const entities = useMemo(() => {
    const seen = new Map<string, AppState["rows"][number]>();
    rows
      .filter((row) => row.level === level)
      .forEach((row) => {
        const key = mappingKey(row.level, row.entityName, row.parentName);
        if (!seen.has(key)) seen.set(key, row);
      });
    return [...seen.values()].sort((a, b) => b.spend - a.spend);
  }, [rows, level]);

  const mappingMap = useMemo(
    () =>
      new Map(
        mappings.map((mapping) => [
          mappingKey(mapping.level, mapping.originalName, mapping.parentName),
          mapping,
        ]),
      ),
    [mappings],
  );

  return (
    <Panel
      title="Nomenclatura"
      body="Ensine o sistema a traduzir nomes como AD09 para nomes amigáveis, tipos, tags e contexto de negócio."
    >
      {selectedClient ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(["campaign", "adset", "ad"] as ReportLevel[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  level === item
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/[0.05]"
                }`}
              >
                {item === "campaign" ? "Campanhas" : item === "adset" ? "Públicos" : "Criativos"}
              </button>
            ))}
          </div>

          {entities.length === 0 ? (
            <EmptyPanel
              title="Nada para nomear ainda"
              body="Importe uma planilha desse nível para liberar os campos de nomenclatura."
            />
          ) : (
            <div className="space-y-4">
              {entities.slice(0, 60).map((row) => {
                const current = mappingMap.get(mappingKey(row.level, row.entityName, row.parentName));
                return (
                  <form
                    key={mappingKey(row.level, row.entityName, row.parentName)}
                    action={onSave}
                    className="rounded-lg border border-white/10 bg-black/20 p-4"
                  >
                    <input type="hidden" name="level" value={row.level} />
                    <input type="hidden" name="originalName" value={row.entityName} />
                    <input type="hidden" name="parentName" value={row.parentName ?? ""} />
                    <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                      <div>
                        <p className="text-xs uppercase text-zinc-600">Nome original</p>
                        <p className="mt-1 font-medium text-zinc-100">{row.entityName}</p>
                        {row.parentName ? <p className="mt-1 text-xs text-zinc-500">Pai: {row.parentName}</p> : null}
                      </div>
                      <div className="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-400">
                        {formatCurrency(row.spend)} | {row.results} resultados
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <Input name="friendlyName" label="Nome amigável" placeholder="Ex: Promessa webinar AD09" defaultValue={current?.friendlyName ?? ""} />
                      <label className="block">
                        <span className="text-xs text-zinc-500">Objetivo manual</span>
                        <select
                          name="manualObjective"
                          defaultValue={current?.manualObjective ?? ""}
                          className="mt-1 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 py-2 text-sm outline-none"
                        >
                          <option value="">Manter automático</option>
                          <option value="sales">Vendas</option>
                          <option value="lead">Leads</option>
                          <option value="message">Mensagens</option>
                          <option value="engagement">Engajamento</option>
                          <option value="traffic">Tráfego</option>
                          <option value="reach">Alcance</option>
                          <option value="unknown">Não classificado</option>
                        </select>
                      </label>
                      <Input name="type" label="Tipo" placeholder="Teste, escala, rmkt..." defaultValue={current?.type ?? ""} />
                      <Input name="mainTag" label="Tag principal" placeholder="Webinar, depoimento..." defaultValue={current?.mainTag ?? ""} />
                      {level === "ad" ? (
                        <>
                          <Input name="creativeType" label="Tipo de criativo" placeholder="Vídeo, imagem, print..." defaultValue={current?.creativeType ?? ""} />
                          <Input name="creativeAngle" label="Ângulo" placeholder="Dor, desejo, prova..." defaultValue={current?.creativeAngle ?? ""} />
                          <Input name="offer" label="Oferta" placeholder="Webinário, ingresso..." defaultValue={current?.offer ?? ""} />
                          <Input name="creativeStatus" label="Status" placeholder="Teste, validado, cansado..." defaultValue={current?.creativeStatus ?? ""} />
                        </>
                      ) : null}
                      {level === "adset" ? (
                        <>
                          <Input name="audienceType" label="Tipo de público" placeholder="Aberto, interesse, rmkt..." defaultValue={current?.audienceType ?? ""} />
                          <Input name="audienceTemperature" label="Temperatura" placeholder="Frio, morno, quente" defaultValue={current?.audienceTemperature ?? ""} />
                          <Input name="audienceRegion" label="Região" placeholder="SP, interior..." defaultValue={current?.audienceRegion ?? ""} />
                          <Input name="audienceAge" label="Idade" placeholder="22-40" defaultValue={current?.audienceAge ?? ""} />
                          <Input name="audienceGender" label="Gênero" placeholder="Homens, mulheres..." defaultValue={current?.audienceGender ?? ""} />
                        </>
                      ) : null}
                      <Input name="notes" label="Observação" placeholder="Contexto livre" defaultValue={current?.notes ?? ""} />
                    </div>

                    <button className="mt-4 flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
                      <Save size={16} />
                      Salvar nomenclatura
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <EmptyPanel title="Selecione um cliente" body="A nomenclatura é salva por cliente." />
      )}
    </Panel>
  );
}

function GoalsStep({
  selectedClient,
  onSave,
}: {
  selectedClient?: ClientDashboard;
  onSave: (formData: FormData) => void;
}) {
  return (
    <Panel title="Metas manuais" body="Essas metas alimentam alertas e leituras do dashboard.">
      {selectedClient ? (
        <form action={onSave} className="grid gap-3 md:grid-cols-3">
          <Input name="targetRoas" label="ROAS minimo" placeholder="1.2" defaultValue={selectedClient.goals.targetRoas ?? ""} />
          <Input name="maxCpa" label="CPA max." placeholder="90" defaultValue={selectedClient.goals.maxCpa ?? ""} />
          <Input name="maxCpl" label="CPL max." placeholder="30" defaultValue={selectedClient.goals.maxCpl ?? ""} />
          <Input name="maxCostPerMessage" label="Conversa max." placeholder="15" defaultValue={selectedClient.goals.maxCostPerMessage ?? ""} />
          <Input name="maxSpendWithoutResult" label="Gasto sem resultado" placeholder="100" defaultValue={selectedClient.goals.maxSpendWithoutResult ?? ""} />
          <Input name="maxFrequency" label="Frequencia max." placeholder="2.5" defaultValue={selectedClient.goals.maxFrequency ?? ""} />
          <Input name="minCtr" label="CTR minimo" placeholder="1" defaultValue={selectedClient.goals.minCtr ?? ""} />
          <Input name="expectedLeadValue" label="Valor por lead" placeholder="0" defaultValue={selectedClient.goals.expectedLeadValue ?? ""} />
          <Input name="closeRate" label="Taxa fechamento" placeholder="0.1" defaultValue={selectedClient.goals.closeRate ?? ""} />
          <button className="flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 md:col-span-3">
            <Save size={16} />
            Salvar metas
          </button>
        </form>
      ) : (
        <EmptyPanel title="Selecione um cliente" body="As metas sao configuradas por cliente." />
      )}
    </Panel>
  );
}

function DataStep({
  selectedClient,
  onClearClientData,
  onDeleteClient,
  onResetEverything,
  onRestoreDemo,
}: {
  selectedClient?: ClientDashboard;
  onClearClientData: () => void;
  onDeleteClient: () => void;
  onResetEverything: () => void;
  onRestoreDemo: () => void;
}) {
  return (
    <Panel title="Gerenciar dados" body="Area exclusiva do admin para limpar testes e restaurar dados.">
      <div className="grid gap-3 md:grid-cols-2">
        <DangerButton disabled={!selectedClient} onClick={onClearClientData} label="Limpar dados do cliente" />
        <DangerButton disabled={!selectedClient} onClick={onDeleteClient} label="Apagar cliente selecionado" />
        <DangerButton onClick={onResetEverything} label="Resetar tudo" strong />
        <button
          type="button"
          onClick={onRestoreDemo}
          className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/[0.06]"
        >
          <RotateCcw size={16} />
          Restaurar demo
        </button>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Enquanto o Supabase nao estiver conectado, essas acoes alteram apenas o armazenamento local deste navegador.
      </p>
    </Panel>
  );
}

function DangerButton({
  label,
  onClick,
  disabled,
  strong,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        strong
          ? "bg-rose-300 text-rose-950 hover:bg-rose-200"
          : "border border-rose-300/30 text-rose-100 hover:bg-rose-300/10"
      }`}
    >
      <Trash2 size={16} />
      {label}
    </button>
  );
}

function Panel({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-5 border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{body}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 py-2 text-sm outline-none placeholder:text-zinc-700 focus:border-cyan-300/70"
      />
    </label>
  );
}
