import { Bell, Search, UserCircle2 } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          StockFlow AI Dashboard
        </h1>

        <p className="text-slate-500">
          AI-powered Inventory • Carbon Intelligence • Fleet Optimization
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <button className="p-2 rounded-lg bg-slate-100">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle2 size={36} />
          <div>
            <div className="font-semibold">Admin</div>
            <div className="text-sm text-slate-500">
              Sustainability Manager
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}