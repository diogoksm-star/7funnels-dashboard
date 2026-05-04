"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/format";

type ChartPoint = {
  name: string;
  gasto: number;
  resultados: number;
};

export default function ObjectiveChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
        <YAxis stroke="#a1a1aa" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #334155", borderRadius: 8 }}
          formatter={(value, name) => {
            const numericValue = Number(value) || 0;
            return [
              name === "gasto" ? formatCurrency(numericValue) : formatNumber(numericValue),
              name === "gasto" ? "Gasto" : "Resultados",
            ];
          }}
        />
        <Bar dataKey="gasto" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resultados" fill="#a3e635" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
