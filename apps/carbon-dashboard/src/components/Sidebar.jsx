import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  BrainCircuit,
  Leaf,
  Truck,
  FileText,
  Settings,
} from "lucide-react";

const menus = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Inventory",
    icon: Boxes,
    path: "/calculator",
  },
  {
    name: "Forecasting",
    icon: BrainCircuit,
    path: "/recommendations",
  },
  {
    name: "Carbon Intelligence",
    icon: Leaf,
    path: "/analytics",
  },
  {
    name: "Transport Intelligence",
    icon: Truck,
    path: "/fleet",
  },
  {
    name: "Reports",
    icon: FileText,
    path: "/reports",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-900 text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold text-emerald-400 mb-10">
        StockFlow AI
      </h1>

      <nav className="space-y-2">
        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}