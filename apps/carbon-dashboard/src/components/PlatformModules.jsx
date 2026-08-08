import {
  Boxes,
  BrainCircuit,
  Leaf,
  Truck,
} from "lucide-react";

const modules = [
  {
    title: "Inventory",
    icon: Boxes,
    color: "bg-blue-500",
  },
  {
    title: "Forecasting",
    icon: BrainCircuit,
    color: "bg-purple-500",
  },
  {
    title: "Carbon Intelligence",
    icon: Leaf,
    color: "bg-emerald-500",
  },
  {
    title: "Transport Intelligence",
    icon: Truck,
    color: "bg-orange-500",
  },
];

export default function PlatformModules() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {modules.map((module) => {
        const Icon = module.icon;

        return (
          <div
            key={module.title}
            className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-lg transition"
          >
            <div
              className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center text-white`}
            >
              <Icon size={22} />
            </div>

            <h3 className="font-semibold mt-4">
              {module.title}
            </h3>
          </div>
        );
      })}
    </div>
  );
}