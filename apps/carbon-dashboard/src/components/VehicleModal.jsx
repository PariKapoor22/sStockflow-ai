import { useState, useEffect } from "react";

export default function VehicleModal({
  open,
  onClose,
  onSave,
  vehicle,
}) {
  const [form, setForm] = useState({
    vehicle_name: "",
    vehicle_number: "",
    vehicle_type: "",
    fuel_type: "",
    capacity: "",
    mileage: "",
    emission_factor: "",
    driver_name: "",
    status: "Available",
  });

  useEffect(() => {
    if (vehicle) {
      setForm(vehicle);
    }
  }, [vehicle]);

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
      capacity: Number(form.capacity),
      mileage: Number(form.mileage),
      emission_factor: Number(form.emission_factor),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl w-[700px] p-8">

        <h2 className="text-2xl font-bold mb-6">
          Add Vehicle
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <input
            name="vehicle_name"
            placeholder="Vehicle Name"
            value={form.vehicle_name}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="vehicle_number"
            placeholder="Vehicle Number"
            value={form.vehicle_number}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="vehicle_type"
            placeholder="Vehicle Type"
            value={form.vehicle_type}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="fuel_type"
            placeholder="Fuel Type"
            value={form.fuel_type}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={form.capacity}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="mileage"
            placeholder="Mileage"
            value={form.mileage}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            name="emission_factor"
            placeholder="Emission Factor"
            value={form.emission_factor}
            onChange={handleChange}
            className="border rounded-xl p-3"
          />

          <input
            name="driver_name"
            placeholder="Driver Name"
            value={form.driver_name}
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
            Save Vehicle
          </button>

        </div>

      </div>

    </div>
  );
}