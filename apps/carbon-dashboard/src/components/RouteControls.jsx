import { useState } from "react";

export default function RouteControls({ onCalculate }) {
  const [form, setForm] = useState({
    source: "Chennai",
    destination: "Bangalore",
    mileage: 18,
    fuel_type: "Diesel",
  });

  const warehouseCoordinates = {
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Bangalore: { lat: 12.9716, lon: 77.5946 },
    Hyderabad: { lat: 17.3850, lon: 78.4867 },
    Mumbai: { lat: 19.0760, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.2090 },
  };

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function calculate() {
    const source = warehouseCoordinates[form.source];
    const destination = warehouseCoordinates[form.destination];

    onCalculate({
      source: form.source,
      destination: form.destination,
      origin_lat: source.lat,
      origin_lon: source.lon,
      destination_lat: destination.lat,
      destination_lon: destination.lon,
      mileage: Number(form.mileage),
      fuel_type: form.fuel_type,
    });
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-2xl font-bold mb-6">
        Route Controls
      </h2>

      <div className="space-y-5">

        <select
          name="source"
          value={form.source}
          onChange={handleChange}
          className="w-full border rounded-xl p-3"
        >
          <option>Chennai</option>
          <option>Bangalore</option>
          <option>Hyderabad</option>
          <option>Mumbai</option>
          <option>Delhi</option>
        </select>

        <select
          name="destination"
          value={form.destination}
          onChange={handleChange}
          className="w-full border rounded-xl p-3"
        >
          <option>Bangalore</option>
          <option>Chennai</option>
          <option>Hyderabad</option>
          <option>Mumbai</option>
          <option>Delhi</option>
        </select>

        <input
          type="number"
          name="mileage"
          value={form.mileage}
          onChange={handleChange}
          className="w-full border rounded-xl p-3"
          placeholder="Mileage"
        />

        <select
          name="fuel_type"
          value={form.fuel_type}
          onChange={handleChange}
          className="w-full border rounded-xl p-3"
        >
          <option>Diesel</option>
          <option>Petrol</option>
          <option>Electric</option>
          <option>CNG</option>
        </select>

        <button
          onClick={calculate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold"
        >
          Optimize Route
        </button>

      </div>

    </div>
  );
}