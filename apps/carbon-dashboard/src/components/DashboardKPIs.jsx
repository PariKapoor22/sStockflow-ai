import { Brain, Leaf, Route, Truck } from "lucide-react";

export default function DashboardKPIs({ data }) {
  if (!data) return null;

  const cards = [
    {
      title: "AI Recommendations",
      value: data.ai_recommendations,
      icon: <Brain size={28} />,
      color: "bg-violet-100 text-violet-700",
    },
    {
      title: "Carbon Saved",
      value: data.carbon_saved,
      icon: <Leaf size={28} />,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Active Shipments",
      value: data.active_shipments,
      icon: <Route size={28} />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Fleet Utilization",
      value: data.fleet_utilization,
      icon: <Truck size={28} />,
      color: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl shadow-md border border-slate-200 p-6 hover:shadow-xl transition duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">{card.title}</p>

              <h2 className="text-3xl font-bold mt-3 text-slate-800">
                {card.value}
              </h2>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}