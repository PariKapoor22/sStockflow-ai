import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

export default function CarbonTrendChart({ data }) {

  if (!data) return null;

  const chartData = data.months.map((month, index) => ({
    month,
    emission: data.monthly_emissions[index],
  }));

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-6">
        Carbon Emission Trend
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>

          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="emission"
            stroke="#10b981"
            strokeWidth={3}
          />

        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}