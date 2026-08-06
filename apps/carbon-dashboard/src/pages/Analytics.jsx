import DashboardLayout from "../layouts/DashboardLayout";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const monthlyData = [
  { month: "Jan", emission: 950 },
  { month: "Feb", emission: 820 },
  { month: "Mar", emission: 780 },
  { month: "Apr", emission: 720 },
  { month: "May", emission: 680 },
  { month: "Jun", emission: 610 },
];

const sourceData = [
  { name: "Electricity", value: 42 },
  { name: "Fuel", value: 28 },
  { name: "Transport", value: 18 },
  { name: "Waste", value: 12 },
];

const COLORS = [
  "#10B981",
  "#059669",
  "#34D399",
  "#6EE7B7",
];

export default function Analytics() {
  return (
    <DashboardLayout>

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          Analytics

        </h1>

        <p className="text-slate-500 mt-2">

          Analyze your carbon footprint and sustainability trends.

        </p>

      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          <h2 className="text-xl font-bold mb-6">

            Monthly Emissions

          </h2>

          <ResponsiveContainer width="100%" height={320}>

            <LineChart data={monthlyData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="emission"
                stroke="#10B981"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          <h2 className="text-xl font-bold mb-6">

            Emission Sources

          </h2>

          <ResponsiveContainer width="100%" height={320}>

            <PieChart>

              <Pie
                data={sourceData}
                dataKey="value"
                outerRadius={110}
                label
              >

                {sourceData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <h3 className="text-slate-500">

            Total Carbon

          </h3>

          <p className="text-3xl font-bold mt-4">

            5.56 tCO₂e

          </p>

        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <h3 className="text-slate-500">

            Reduction

          </h3>

          <p className="text-3xl font-bold text-emerald-600 mt-4">

            18%

          </p>

        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <h3 className="text-slate-500">

            Sustainability Rating

          </h3>

          <p className="text-3xl font-bold mt-4">

            A+

          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}