import {
  Truck,
  MapPin,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function LiveFleetMap() {
  const vehicles = [
    {
      id: "TRK-101",
      location: "Chennai",
      status: "On Route",
      progress: 78,
      color: "bg-emerald-500",
    },
    {
      id: "TRK-205",
      location: "Bangalore",
      status: "Loading",
      progress: 42,
      color: "bg-blue-500",
    },
    {
      id: "TRK-308",
      location: "Hyderabad",
      status: "Maintenance",
      progress: 15,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">
            Transport Intelligence
          </h2>

          <p className="text-slate-500 mt-2">
            Real-time fleet monitoring and logistics overview
          </p>

        </div>

        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-semibold">
          Live
        </div>

      </div>

      {/* KPI Row */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="rounded-2xl bg-slate-50 p-5 border">

          <Truck className="text-blue-600 mb-3" />

          <h3 className="text-3xl font-bold">
            26
          </h3>

          <p className="text-slate-500">
            Active Vehicles
          </p>

        </div>

        <div className="rounded-2xl bg-slate-50 p-5 border">

          <CheckCircle2 className="text-emerald-600 mb-3" />

          <h3 className="text-3xl font-bold">
            97%
          </h3>

          <p className="text-slate-500">
            On-Time Deliveries
          </p>

        </div>

        <div className="rounded-2xl bg-slate-50 p-5 border">

          <AlertTriangle className="text-orange-500 mb-3" />

          <h3 className="text-3xl font-bold">
            2
          </h3>

          <p className="text-slate-500">
            Vehicles in Maintenance
          </p>

        </div>

      </div>

      {/* Fleet Cards */}

      <div className="space-y-5">

        {vehicles.map((vehicle) => (

          <div
            key={vehicle.id}
            className="border rounded-2xl p-5 hover:shadow-md transition"
          >

            <div className="flex justify-between items-center">

              <div>

                <h3 className="font-bold text-lg">
                  {vehicle.id}
                </h3>

                <div className="flex items-center gap-2 text-slate-500 mt-2">

                  <MapPin size={16} />

                  {vehicle.location}

                </div>

              </div>

              <span
                className={`px-4 py-2 rounded-full text-white ${vehicle.color}`}
              >
                {vehicle.status}
              </span>

            </div>

            <div className="mt-5">

              <div className="flex justify-between text-sm text-slate-500 mb-2">

                <span>Delivery Progress</span>

                <span>{vehicle.progress}%</span>

              </div>

              <div className="w-full bg-slate-200 rounded-full h-3">

                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${vehicle.progress}%`,
                  }}
                />

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* Footer */}

      <div className="mt-8 flex items-center justify-center rounded-2xl bg-slate-50 border p-8">

        <div className="text-center">

          <Activity
            className="mx-auto text-emerald-600"
            size={36}
          />

          <h3 className="text-xl font-bold mt-4">
            Live GPS Tracking
          </h3>

          <p className="text-slate-500 mt-2 max-w-lg">
            GPS integration is the next planned enhancement. This section
            will display live vehicle locations, optimized routes, ETA,
            and delivery performance.
          </p>

        </div>

      </div>

    </div>
  );
}