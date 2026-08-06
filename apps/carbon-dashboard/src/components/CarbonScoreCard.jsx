import { useContext } from "react";
import { CarbonContext } from "../context/CarbonContext";

export default function CarbonScoreCard() {
  const { latestRecord } = useContext(CarbonContext);

  const score = latestRecord ? latestRecord.carbonScore : 0;

  let rating = "Not Available";

  if (score >= 90) rating = "Excellent";
  else if (score >= 75) rating = "Good";
  else if (score >= 60) rating = "Average";
  else rating = "Needs Improvement";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-xl font-bold mb-8">
        Carbon Score
      </h2>

      <div className="flex justify-center">
        <div className="w-44 h-44 rounded-full bg-emerald-100 flex items-center justify-center border-8 border-emerald-500">
          <span className="text-5xl font-bold text-emerald-600">
            {score}
          </span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-500">
          Sustainability Rating
        </p>

        <h3 className="text-2xl font-bold text-emerald-600 mt-2">
          {rating}
        </h3>
      </div>
    </div>
  );
}