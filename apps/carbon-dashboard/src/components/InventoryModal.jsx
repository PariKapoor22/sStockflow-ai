import { useState } from "react";

export default function InventoryModal({
  open,
  onClose,
  onSave,
}) {

  const [form, setForm] = useState({
    warehouse: "",
    sku: "",
    product_name: "",
    available_quantity: "",
    safety_stock: "",
    forecast_7_days: "",
    expiry_date: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    onSave({
      ...form,
      available_quantity: Number(form.available_quantity),
      safety_stock: Number(form.safety_stock),
      forecast_7_days: Number(form.forecast_7_days),
    });

    onClose();
  };

  return (

    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl w-[700px] p-8">

        <h2 className="text-2xl font-bold mb-6">

          Add Inventory

        </h2>

        <div className="grid grid-cols-2 gap-4">

          <input
            name="warehouse"
            placeholder="Warehouse"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="sku"
            placeholder="SKU"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="product_name"
            placeholder="Product Name"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="available_quantity"
            placeholder="Available Quantity"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="safety_stock"
            placeholder="Safety Stock"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="forecast_7_days"
            placeholder="Forecast (7 Days)"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="date"
            name="expiry_date"
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  );

}