import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts";
import type { RentalStatus } from "../../types/domain";

interface RentalStatusChartProps {
  data: { status: RentalStatus; total: number }[];
}

const COLORS = {
  Agendado: "#0ea5e9",
  Ativo: "#2563eb",
  Concluido: "#22c55e",
  Atrasado: "#f97316"
};

export const RentalStatusChart = ({ data }: RentalStatusChartProps) => (
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie
        data={data}
        dataKey="total"
        nameKey="status"
        innerRadius={70}
        outerRadius={110}
        paddingAngle={4}
      >
        {data.map((entry) => (
          <Cell
            key={entry.status}
            fill={COLORS[entry.status]}
            stroke="transparent"
          />
        ))}
      </Pie>
      <Tooltip formatter={(value: number, _name, entry) => [`${value} locações`, entry.payload.status]} />
    </PieChart>
  </ResponsiveContainer>
);
