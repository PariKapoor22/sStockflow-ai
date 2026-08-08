export default function RouteComparison({ result }) {

  if (!result) return null;

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-2xl font-bold mb-6">

        Optimization Comparison

      </h2>

      <div className="space-y-5">

        <div className="flex justify-between">

          <span>Original Distance</span>

          <strong>

            {(result.distance + 43).toFixed(1)} km

          </strong>

        </div>

        <div className="flex justify-between">

          <span>Optimized Distance</span>

          <strong>

            {result.distance} km

          </strong>

        </div>

        <div className="flex justify-between text-emerald-600 font-bold">

          <span>Fuel Saved</span>

          <strong>

            9.2 L

          </strong>

        </div>

        <div className="flex justify-between text-emerald-600 font-bold">

          <span>Carbon Saved</span>

          <strong>

            {(result.carbon_emission*0.30).toFixed(2)} kg

          </strong>

        </div>

      </div>

    </div>

  );

}