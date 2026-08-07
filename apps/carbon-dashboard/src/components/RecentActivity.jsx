import {
  Truck,
  Leaf,
  BrainCircuit,
  PackageCheck,
  Clock,
} from "lucide-react";

export default function RecentActivity({ data }) {
  if (!data) return null;

  const activities = [
    {
      icon: Truck,
      color: "bg-blue-100 text-blue-600",
      title: "Route Optimized",
      description: "AI optimized Chennai → Bangalore delivery route.",
      time: "5 mins ago",
    },
    {
      icon: Leaf,
      color: "bg-emerald-100 text-emerald-600",
      title: "Carbon Report Generated",
      description: "Monthly sustainability report generated successfully.",
      time: "18 mins ago",
    },
    {
      icon: BrainCircuit,
      color: "bg-violet-100 text-violet-600",
      title: "AI Recommendation",
      description: "Suggested warehouse transfer to avoid stock shortage.",
      time: "42 mins ago",
    },
    {
      icon: PackageCheck,
      color: "bg-orange-100 text-orange-600",
      title: "Shipment Delivered",
      description: "Order #SF-2045 delivered successfully.",
      time: "1 hour ago",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Recent Activity
          </h2>

          <p className="text-slate-500 mt-1">
            Latest updates across your supply chain
          </p>
        </div>

        <Clock className="text-slate-400" size={22} />

      </div>

      <div className="space-y-6">

        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={index}
              className="flex gap-4 items-start hover:bg-slate-50 rounded-2xl p-3 transition-all duration-300"
            >

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.color}`}
              >
                <Icon size={22} />
              </div>

              <div className="flex-1">

                <div className="flex justify-between items-center">

                  <h3 className="font-semibold text-slate-800">
                    {activity.title}
                  </h3>

                  <span className="text-xs text-slate-400">
                    {activity.time}
                  </span>

                </div>

                <p className="text-slate-500 mt-2">
                  {activity.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}