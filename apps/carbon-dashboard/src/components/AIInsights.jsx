import { Lightbulb } from "lucide-react";

export default function AIInsights() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <div className="flex items-center gap-3 mb-4">

        <Lightbulb className="text-yellow-500" size={24} />

        <h2 className="text-xl font-bold">
          AI Insights
        </h2>

      </div>

      <p className="text-slate-600 leading-7">
        Transport emissions are contributing the highest share of your
        carbon footprint. Optimizing delivery routes and shifting part
        of the fleet to electric vehicles could reduce emissions by
        approximately <strong>12%</strong>.
      </p>

    </div>
  );
}