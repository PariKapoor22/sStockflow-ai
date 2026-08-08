export default function AIRouteCard({ result }) {

  if (!result) return null;

  return (

    <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl p-6 text-white">

      <h2 className="text-2xl font-bold">

        AI Recommendation

      </h2>

      <div className="mt-5 space-y-3">

        <p>

          ✅ Estimated Distance :
          <strong> {result.distance} km</strong>

        </p>

        <p>

          ⛽ Estimated Fuel :
          <strong> {result.fuel_used} L</strong>

        </p>

        <p>

          🌱 Carbon Emission :
          <strong> {result.carbon_emission} kg CO₂</strong>

        </p>

        <p>

          ⏱ Estimated Time :
          <strong> {result.travel_time} hrs</strong>

        </p>

        <hr className="my-4"/>

        <p>

          🤖 AI Suggestion

        </p>

        <p className="font-semibold">

          Choose an Electric Vehicle for shorter city routes to reduce emissions.

        </p>

      </div>

    </div>

  );

}