import {
  BrainCircuit,
  Leaf,
  Truck,
  Boxes,
  TrendingUp,
} from "lucide-react";

export default function DashboardKPIs({ data }) {
  if (!data) return null;

  const cards = [
    {
      title: "AI Recommendations",
      value: data.ai_recommendations ?? 12,
      subtitle: "Optimizations Available",
      icon: BrainCircuit,
      bg: "bg-violet-50",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      trend: "+18%",
    },
    {
      title: "Carbon Saved",
      value: `${data.carbon_saved ?? 245} kg`,
      subtitle: "Reduced This Month",
      icon: Leaf,
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "+12%",
    },
    {
      title: "Fleet Utilization",
      value: `${data.fleet_utilization ?? 94}%`,
      subtitle: "Vehicles in Operation",
      icon: Truck,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+6%",
    },
    {
      title: "Inventory Health",
      value: data.active_shipments ?? 342,
      subtitle: "Active Shipments",
      icon: Boxes,
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      trend: "+9%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`${card.bg} rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm">
                  {card.title}
                </p>

                <h2 className="text-3xl font-bold text-slate-800 mt-3">
                  {card.value}
                </h2>

                <p className="text-slate-500 text-sm mt-2">
                  {card.subtitle}
                </p>
              </div>

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg}`}
              >
                <Icon
                  className={card.iconColor}
                  size={28}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <TrendingUp
                size={18}
                className="text-emerald-600"
              />

              <span className="text-emerald-600 font-semibold">
                {card.trend}
              </span>

              <span className="text-slate-400 text-sm">
                vs last month
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}