import {
  CheckCircle,
  XCircle,
  MapPinned,
  Truck,
  Leaf,
} from "lucide-react";

export default function RecommendationCard({
  recommendation,
  onApprove,
  onReject,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 hover:shadow-xl transition">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {recommendation.inventory.product_name}
          </h2>

          <p className="text-slate-500">
            SKU : {recommendation.inventory.sku}
          </p>
        </div>

        <span
          className={`px-4 py-2 rounded-full font-semibold ${
            recommendation.status === "Approved"
              ? "bg-green-100 text-green-700"
              : recommendation.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {recommendation.status}
        </span>

      </div>

      <hr className="my-6" />

      {/* Route */}

      <div className="space-y-4">

        <div className="flex justify-between">

          <span className="font-semibold">
            Source
          </span>

          <span>
            {recommendation.route.source}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">
            Destination
          </span>

          <span>
            {recommendation.route.destination}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">
            Vehicle
          </span>

          <span className="flex gap-2 items-center">

            <Truck size={18}/>

            {recommendation.fleet.vehicle_name}

          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">
            Distance
          </span>

          <span>

            {recommendation.estimated_distance} km

          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">

            Travel Time

          </span>

          <span>

            {recommendation.estimated_time} hrs

          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">

            Fuel Used

          </span>

          <span>

            {recommendation.estimated_fuel} L

          </span>

        </div>

        <div className="flex justify-between text-green-700 font-bold">

          <span>

            <Leaf
              size={18}
              className="inline mr-2"
            />

            Carbon Saved

          </span>

          <span>

            {recommendation.carbon_saved} kg

          </span>

        </div>

        <div className="flex justify-between text-2xl font-bold">

          <span>

            AI Score

          </span>

          <span className="text-emerald-600">

            {recommendation.score}/100

          </span>

        </div>

      </div>

      <div className="flex gap-3 mt-8">

        <button
          onClick={() => onApprove(recommendation.id)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <CheckCircle size={18}/>

          Approve

        </button>

        <button
          onClick={() => onReject(recommendation.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <XCircle size={18}/>

          Reject

        </button>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl"
        >
          <MapPinned size={20}/>
        </button>

      </div>

    </div>
  );
}