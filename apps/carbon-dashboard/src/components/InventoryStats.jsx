import {
  Package,
  AlertTriangle,
  ShieldCheck,
  Warehouse,
} from "lucide-react";

export default function InventoryStats({ inventory }) {

  const total = inventory.length;

  const highRisk = inventory.filter(
    item => item.risk === "High"
  ).length;

  const safe = inventory.filter(
    item => item.risk === "Low"
  ).length;

  const stats = [

    {
      title: "Inventory Items",
      value: total,
      icon: <Package size={28} />,
      color: "bg-blue-100 text-blue-600",
    },

    {
      title: "High Risk",
      value: highRisk,
      icon: <AlertTriangle size={28} />,
      color: "bg-red-100 text-red-600",
    },

    {
      title: "Safe Inventory",
      value: safe,
      icon: <ShieldCheck size={28} />,
      color: "bg-emerald-100 text-emerald-600",
    },

    {
      title: "Warehouses",
      value: [...new Set(
        inventory.map(i => i.warehouse)
      )].length,
      icon: <Warehouse size={28} />,
      color: "bg-purple-100 text-purple-600",
    },

  ];

  return (

    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

      {stats.map((item, index) => (

        <div
          key={index}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-lg transition"
        >

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">

                {item.title}

              </p>

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