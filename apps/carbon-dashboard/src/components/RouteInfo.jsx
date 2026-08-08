export default function RouteInfo({ result }) {

  if (!result) return null;

  return (

    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

      <h2 className="text-2xl font-bold mb-6">

        Route Information

      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">

          <span>Distance</span>

          <strong>{result.distance} km</strong>

        </div>

        <div className="flex justify-between">

          <span>Fuel Used</span>

          <strong>{result.fuel_used} L</strong>

        </div>

        <div className="flex justify-between">

          <span>Travel Time</span>

          <strong>{result.travel_time} hrs</strong>

        </div>

        <div className="flex justify-between text-emerald-600 text-xl font-bold">

          <span>CO₂ Emission</span>

          <span>{result.carbon_emission} kg</span>

        </div>

      </div>

    </div>

  );

}