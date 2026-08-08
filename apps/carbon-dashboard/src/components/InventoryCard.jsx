import RiskBadge from "./RiskBadge";
import { Package, Trash2, Pencil } from "lucide-react";

export default function InventoryCard({
  item,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-xl transition duration-300">

      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-xl font-bold">
            {item.product_name}
          </h2>

          <p className="text-slate-500">
            {item.sku}
          </p>
        </div>

        <RiskBadge risk={item.risk} />

      </div>

      <div className="mt-6 space-y-3">

        <p>
          <strong>Warehouse:</strong> {item.warehouse}
        </p>

        <p>
          <strong>Available:</strong> {item.available_quantity}
        </p>

        <p>
          <strong>Safety Stock:</strong> {item.safety_stock}
        </p>

        <p>
          <strong>Forecast (7 Days):</strong> {item.forecast_7_days}
        </p>

        <p>
          <strong>Days Cover:</strong> {item.days_cover}
        </p>

        <p>
          <strong>Expiry:</strong> {item.expiry_date}
        </p>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl flex items-center justify-center gap-2"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          Delete
        </button>

      </div>

    </div>
  );
}