import {
  Bell,
  Search,
  UserCircle2,
} from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

      {/* Left */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          StockFlow AI Dashboard
        </h1>

        <p className="text-slate-500 text-sm mt-1">
          AI-powered Inventory • Carbon Intelligence • Fleet Optimization
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        {/* Search */}
        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              w-72
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              py-3
              pl-11
              pr-4
              outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
          />

        </div>

        {/* Notification */}
        <button className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center">
          <Bell size={20} />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2">

          <UserCircle2
            size={38}
            className="text-slate-600"
          />

          <div>

            <h2 className="font-semibold">
              Admin
            </h2>

            <p className="text-xs text-slate-500">
              Sustainability Manager
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}