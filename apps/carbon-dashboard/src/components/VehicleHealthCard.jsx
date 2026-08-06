export default function VehicleHealthCard() {

  const vehicles = [

    {
      name: "Truck 01",
      health: 94,
      status: "Excellent",
    },

    {
      name: "Truck 02",
      health: 82,
      status: "Good",
    },

    {
      name: "Truck 03",
      health: 65,
      status: "Maintenance Soon",
    },

    {
      name: "Electric Truck",
      health: 98,
      status: "Excellent",
    },

  ];

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-2xl font-bold mb-6">

        Vehicle Health

      </h2>

      <div className="space-y-6">

        {vehicles.map((vehicle,index)=>(

          <div key={index}>

            <div className="flex justify-between mb-2">

              <span>{vehicle.name}</span>

              <strong>{vehicle.health}%</strong>

            </div>

            <div className="w-full bg-slate-200 rounded-full h-3">

              <div

                className="bg-green-600 h-3 rounded-full"

                style={{

                  width:`${vehicle.health}%`

                }}

              ></div>

            </div>

            <p className="text-sm text-slate-500 mt-2">

              {vehicle.status}

            </p>

          </div>

        ))}

      </div>

    </div>

  );

}