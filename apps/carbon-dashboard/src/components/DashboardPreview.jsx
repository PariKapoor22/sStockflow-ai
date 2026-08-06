import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const lineData = [
  { month: "Jan", emission: 52 },
  { month: "Feb", emission: 48 },
  { month: "Mar", emission: 45 },
  { month: "Apr", emission: 40 },
  { month: "May", emission: 36 },
  { month: "Jun", emission: 31 },
];

const pieData = [
  { name: "Electricity", value: 40 },
  { name: "Transport", value: 25 },
  { name: "Fuel", value: 20 },
  { name: "Waste", value: 15 },
];

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
];

export default function DashboardPreview() {
  return (
    <section className="py-28 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <p className="text-emerald-600 font-semibold uppercase tracking-widest">
            Dashboard
          </p>

          <h2 className="text-4xl font-bold mt-3">
            Monitor Your Carbon Performance
          </h2>

          <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
            Real-time analytics help businesses understand
            where emissions are generated and how they can
            reduce them.
          </p>

        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-16">

          {/* Score */}

          <div className="bg-slate-50 rounded-3xl p-8 shadow-sm border">

            <h3 className="font-bold text-xl">
              Carbon Score
            </h3>

            <h1 className="text-7xl font-black text-emerald-600 mt-8">
              82
            </h1>

            <p className="text-slate-500 mt-3">
              Excellent Sustainability Rating
            </p>

          </div>

          {/* Line Chart */}

          <div className="bg-slate-50 rounded-3xl p-6 shadow-sm border lg:col-span-2">

            <h3 className="font-bold mb-5">
              Monthly Emissions
            </h3>

            <div className="h-72">

              <ResponsiveContainer>

                <LineChart data={lineData}>

                  <Line
                    type="monotone"
                    dataKey="emission"
                    stroke="#10B981"
                    strokeWidth={4}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">

          {/* Pie */}

          <div className="bg-slate-50 rounded-3xl p-6 shadow-sm border">

            <h3 className="font-bold mb-6">
              Emission Sources
            </h3>

            <div className="h-72">

              <ResponsiveContainer>

                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={100}
                  >

                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    ))}

                  </Pie>

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* AI */}

          <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-lg">

            <h3 className="text-2xl font-bold">
              AI Sustainability Insight
            </h3>

            <p className="mt-6 leading-8">

              Based on the last six months of operational
              activity, transport emissions contribute the
              highest percentage of your carbon footprint.

            </p>

            <div className="mt-8 bg-white/20 rounded-2xl p-5">

              Recommendation

              <h2 className="mt-2 text-xl font-bold">

                Shift 30% deliveries to EV logistics to
                reduce emissions by nearly 12%.

              </h2>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}