export type ReportLevel = "campaign" | "adset" | "ad";

export type ObjectiveType =
  | "sales"
  | "lead"
  | "message"
  | "engagement"
  | "reach"
  | "traffic"
  | "unknown";

export type RawRow = Record<string, string | number | null>;

export type MetricRow = {
  id: string;
  importId: string;
  clientId: string;
  level: ReportLevel;
  entityName: string;
  parentName?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: string;
  resultIndicator?: string;
  objective: ObjectiveType;
  raw: RawRow;
  spend: number;
  results: number;
  costPerResult: number;
  impressions: number;
  reach: number;
  frequency: number;
  cpm: number;
  linkClicks: number;
  purchases: number;
  checkouts: number;
  landingPageViews: number;
  roas: number;
  profit: number;
  revenue: number;
  qualityRanking?: string;
  engagementRanking?: string;
  conversionRanking?: string;
};

export type ImportRecord = {
  id: string;
  clientId: string;
  fileName: string;
  level: ReportLevel;
  periodStart?: string;
  periodEnd?: string;
  importedAt: string;
  rowCount: number;
  columns: string[];
};

export type GoalSettings = {
  targetRoas?: number;
  maxCpa?: number;
  maxCpl?: number;
  maxCostPerMessage?: number;
  maxSpendWithoutResult?: number;
  maxFrequency?: number;
  minCtr?: number;
  expectedLeadValue?: number;
  closeRate?: number;
};

export type ClientDashboard = {
  id: string;
  name: string;
  slug: string;
  password: string;
  subtitle: string;
  goals: GoalSettings;
  createdAt: string;
};

export type EntityMapping = {
  id: string;
  clientId: string;
  level: ReportLevel;
  originalName: string;
  parentName?: string;
  friendlyName?: string;
  manualObjective?: ObjectiveType;
  type?: string;
  mainTag?: string;
  notes?: string;
  creativeType?: string;
  creativeAngle?: string;
  offer?: string;
  creativeStatus?: string;
  audienceRegion?: string;
  audienceAge?: string;
  audienceGender?: string;
  audienceTemperature?: string;
  audienceType?: string;
  updatedAt: string;
};

export type AppState = {
  clients: ClientDashboard[];
  imports: ImportRecord[];
  rows: MetricRow[];
  mappings: EntityMapping[];
};

export type SummaryMetrics = {
  spend: number;
  results: number;
  purchases: number;
  leads: number;
  messages: number;
  revenue: number;
  profit: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  checkouts: number;
  landingPageViews: number;
  cpa: number;
  cpl: number;
  costPerMessage: number;
  roas: number;
  cpm: number;
  cpc: number;
  ctr: number;
  frequency: number;
};
