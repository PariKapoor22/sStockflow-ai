import { Truck, CheckCircle, Clock3, Wrench } from "lucide-react";

export default function FleetStats({ vehicles }) {

  const total = vehicles.length;

  const available = vehicles.filter(
    (v) => v.status === "Available"
  ).length;

  const busy = vehicles.filter(
    (v) => v.status === "Busy"
  ).length;

  const maintenance = vehicles.filter(
    (v) => v.status === "Maintenance"
  ).length;

  const stats = [
    {
      title: "Total Vehicles",
      value: total,
      icon: <Truck size={28} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Available",
      value: available,
      icon: <CheckCircle size={28} />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Busy",
      value: busy,
      icon: <Clock3 size={28} />,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "Maintenance",
      value: maintenance,
      icon: <Wrench size={28} />,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500">{item.title}</p>

              <h2 className="text-3xl font-bold mt-3">
                {item.value}
              </h2>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}
            >
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}