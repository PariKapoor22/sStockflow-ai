import {
  LayoutDashboard,
  Calculator,
  BarChart3,
  FileText,
  ShieldCheck,
  Settings,
  Leaf,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menu = [
  { icon: LayoutDashboard, title: "Dashboard", path: "/dashboard" },
  { icon: Calculator, title: "Calculator", path: "/calculator" },
  { icon: BarChart3, title: "Analytics", path: "/analytics" },
  { icon: FileText, title: "Reports", path: "/reports" },
  { icon: ShieldCheck, title: "Verification", path: "/verification" },
  { icon: Settings, title: "Settings", path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 min-h-screen p-6">

      <div className="flex items-center gap-3 mb-10">

        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">

          <Leaf className="text-white"/>

        </div>

        <div>

          <h2 className="font-bold text-xl">
            Carbon Accountability
          </h2>

          <p className="text-sm text-slate-500">
            Sustainability Platform
          </p>

        </div>

      </div>

      <nav className="space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-emerald-500 text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`
              }
            >

              <Icon size={20} />

              {item.title}

            </NavLink>

          );

        })}

      </nav>

    </aside>
  );
}