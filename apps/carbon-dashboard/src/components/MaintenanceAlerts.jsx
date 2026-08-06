export default function MaintenanceAlerts() {

  const alerts = [

    "Truck 03 requires servicing in 5 days.",

    "Van 02 tyre pressure is below threshold.",

    "Electric Truck battery health check due next week.",

  ];

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-2xl font-bold mb-6">

        Maintenance Alerts

      </h2>

      <div className="space-y-4">

        {alerts.map((alert,index)=>(

          <div
            key={index}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >

            {alert}

          </div>

        ))}

      </div>

    </div>

  );

}