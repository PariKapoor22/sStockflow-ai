import { Bell, Search, CircleUserRound } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-1">
          Welcome back! Here's your carbon footprint overview.
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="relative">

          <Search
            className="absolute left-3 top-3 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

        </div>

        <button className="relative p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition">

          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>

        </button>

        <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2">

          <CircleUserRound size={28} className="text-emerald-600" />

          <div>
            <p className="font-semibold text-sm">
              Admin
            </p>

            <p className="text-xs text-slate-500">
              Green Industries Ltd.
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}