import { Link } from "react-router-dom";

export default function QuickActions() {

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

      <h2 className="text-xl font-bold">

        Quick Actions

      </h2>

      <div className="space-y-4 mt-8">

        <Link
          to="/calculator"
          className="block bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 rounded-xl"
        >
          New Calculation
        </Link>

        <Link
          to="/reports"
          className="block bg-slate-100 hover:bg-slate-200 text-center py-3 rounded-xl"
        >
          Generate Report
        </Link>

        <Link
          to="/analytics"
          className="block bg-slate-100 hover:bg-slate-200 text-center py-3 rounded-xl"
        >
          View Analytics
        </Link>

      </div>

    </div>

  );

}