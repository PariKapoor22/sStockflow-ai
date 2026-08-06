import { Award } from "lucide-react";

export default function SustainabilityScore({ data }) {
  if (!data) return null;

  const score = data.sustainability_score;

  return (
    <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <Award className="text-emerald-600" size={36} />
      </div>

      <h2 className="text-xl font-bold mt-5">
        Sustainability Score
      </h2>

      <h1 className="text-6xl font-bold text-emerald-600 mt-4">
        {score}
      </h1>

      <p className="text-slate-500 mt-4 text-center">
        Excellent environmental performance.
        Keep optimizing routes to reduce emissions.
      </p>
    </div>
  );
}