import { Truck, Fuel, User, Trash2, Pencil } from "lucide-react";

export default function VehicleCard({
  vehicle,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-xl transition duration-300">

      <div className="flex justify-between items-center">

        <div className="flex items-center gap-3">

          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">

            <Truck className="text-emerald-600" />

          </div>

          <div>

            <h2 className="font-bold text-lg">

              {vehicle.vehicle_name}

            </h2>

            <p className="text-slate-500">

              {vehicle.vehicle_number}

            </p>

          </div>

        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">

          {vehicle.status}

        </span>

      </div>

      <div className="mt-6 space-y-2">

        <p>

          <strong>Type:</strong> {vehicle.vehicle_type}

        </p>

        <p className="flex items-center gap-2">

          <Fuel size={16} />

          {vehicle.fuel_type}

        </p>

        <p>

          Capacity: {vehicle.capacity} kg

        </p>

        <p>

          Mileage: {vehicle.mileage} km/L

        </p>

        <p className="flex items-center gap-2">

          <User size={16} />

          {vehicle.driver_name}

        </p>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl flex justify-center items-center gap-2"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          onClick={() => onDelete(vehicle.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl flex justify-center items-center gap-2"
        >
          <Trash2 size={16} />
          Delete
        </button>

      </div>

    </div>
  );
}