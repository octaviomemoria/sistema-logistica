import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface RevenueChartProps {
  data: { mes: string; valor: number }[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => (
  <ResponsiveContainer width="100%" height={260}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="mes" stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <Line
        type="monotone"
        dataKey="valor"
        stroke="#2563eb"
        strokeWidth={3}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);
