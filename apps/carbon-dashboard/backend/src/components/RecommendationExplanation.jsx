export default function RecommendationExplanation({
  recommendation,
}) {

  if (!recommendation) return null;

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-2xl font-bold mb-6">

        🤖 AI Explanation

      </h2>

      <ul className="space-y-3">

        {recommendation.recommendation.map(
          (reason,index)=>(
            <li
              key={index}
              className="flex gap-3"
            >
              <span>✅</span>

              <span>{reason}</span>

            </li>
          )
        )}

      </ul>

    </div>

  );

}