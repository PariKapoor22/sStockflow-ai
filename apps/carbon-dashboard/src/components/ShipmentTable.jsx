import { Trash2 } from "lucide-react";

export default function ShipmentTable({
  shipments,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

      <h2 className="text-2xl font-bold mb-6">

        Shipment List

      </h2>

      <div className="overflow-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="py-3">ID</th>
              <th>Company</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Weight</th>
              <th>Priority</th>
              <th>Status</th>
              <th></th>

            </tr>

          </thead>

          <tbody>

            {shipments.map((shipment) => (

              <tr
                key={shipment.id}
                className="border-b text-center"
              >

                <td>{shipment.id}</td>

                <td>{shipment.company}</td>

                <td>{shipment.origin}</td>

                <td>{shipment.destination}</td>

                <td>{shipment.weight} kg</td>

                <td>{shipment.priority}</td>

                <td>

                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">

                    {shipment.status}

                  </span>

                </td>

                <td>

                  <button
                    onClick={() => onDelete(shipment.id)}
                  >

                    <Trash2 className="text-red-500" />

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}