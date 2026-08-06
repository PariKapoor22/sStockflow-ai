import {
  Brain,
  TrendingDown,
  Truck,
  Leaf,
} from "lucide-react";

export default function QuickInsights({ data }) {
  if (!data) return null;

  const insights = [
    {
      icon: <Brain />,
      title: `${data.ai_recommendations} AI Recommendations Available`,
    },
    {
      icon: <Leaf />,
      title: `${data.carbon_saved} kg Carbon Saved`,
    },
    {
      icon: <Truck />,
      title: `${data.active_shipments} Active Shipments`,
    },
    {
      icon: <TrendingDown />,
      title: `${data.fleet_utilization}% Fleet Utilization`,
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        Quick Insights
      </h2>

      <div className="space-y-5">
        {insights.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 transition"
          >
            <div className="text-emerald-600">
              {item.icon}
            </div>

            <span className="font-medium">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}