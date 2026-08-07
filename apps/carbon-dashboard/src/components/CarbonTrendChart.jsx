import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TrendingDown, Leaf } from "lucide-react";

export default function CarbonTrendChart({ data }) {
  if (!data) return null;

  const chartData = (data.months || []).map((month, index) => ({
    month,
    emission: data.monthly_emissions?.[index] ?? 0,
  }));

  const current =
    chartData.length > 0
      ? chartData[chartData.length - 1].emission
      : 0;

  const previous =
    chartData.length > 1
      ? chartData[chartData.length - 2].emission
      : current;

  const difference = previous - current;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      {/* Header */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">
            Carbon Emission Trend
          </h2>

          <p className="text-slate-500 mt-1">
            Monthly emission analytics across operations
          </p>

        </div>

        <div className="bg-emerald-50 rounded-2xl px-5 py-3">

          <div className="flex items-center gap-2">

            <Leaf
              className="text-emerald-600"
              size={20}
            />

            <span className="font-semibold text-emerald-700">
              {difference > 0
                ? `${difference} kg Saved`
                : "Stable"}
            </span>

          </div>

        </div>

      </div>

      <ResponsiveContainer
        width="100%"
        height={360}
      >

        <LineChart data={chartData}>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fill: "#64748b" }}
          />

          <YAxis
            tick={{ fill: "#64748b" }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="emission"
            stroke="#10b981"
            strokeWidth={4}
            dot={{
              r: 5,
              fill: "#10b981",
            }}
            activeDot={{
              r: 7,
            }}
          />

        </LineChart>

      </ResponsiveContainer>

      {/* Footer */}

      <div className="grid grid-cols-3 gap-6 mt-8">

        <div>

          <p className="text-slate-500 text-sm">
            Current Month
          </p>

          <h3 className="text-2xl font-bold mt-1">
            {current} kg
          </h3>

        </div>

        <div>

          <p className="text-slate-500 text-sm">
            Previous Month
          </p>

          <h3 className="text-2xl font-bold mt-1">
            {previous} kg
          </h3>

        </div>

        <div>

          <div className="flex items-center gap-2">

            <TrendingDown
              className="text-emerald-600"
              size={18}
            />

            <span className="text-slate-500 text-sm">
              Reduction
            </span>

          </div>

          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {difference > 0 ? difference : 0} kg
          </h3>

        </div>

      </div>

    </div>
  );
}