import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ShipmentTable from "../components/ShipmentTable";
import {
  createShipment,
  getShipments,
  deleteShipment,
} from "../services/shipmentService";

export default function Shipments() {

  const [shipments, setShipments] = useState([]);

  const [form, setForm] = useState({
    company: "",
    origin: "",
    destination: "",
    weight: "",
    volume: "",
    priority: "Medium",
    delivery_date: "",
    vehicle_type: "",
  });

  async function loadShipments() {

    const res = await getShipments();

    setShipments(res.data);

  }

  useEffect(() => {

    loadShipments();

  }, []);

  function handleChange(e) {

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  }

  async function handleSubmit(e) {

    e.preventDefault();

    await createShipment({
      ...form,
      weight: Number(form.weight),
      volume: Number(form.volume),
    });

    setForm({
      company: "",
      origin: "",
      destination: "",
      weight: "",
      volume: "",
      priority: "Medium",
      delivery_date: "",
      vehicle_type: "",
    });

    loadShipments();

  }

  async function handleDelete(id) {

    await deleteShipment(id);

    loadShipments();

  }

  return (

    <DashboardLayout>

      <h1 className="text-4xl font-bold mb-8">

        Shipment Management

      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-5 bg-white p-8 rounded-3xl shadow-sm border mb-8"
      >

        <input
          name="company"
          placeholder="Company"
          value={form.company}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <input
          name="origin"
          placeholder="Origin"
          value={form.origin}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <input
          name="destination"
          placeholder="Destination"
          value={form.destination}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <input
          type="number"
          name="weight"
          placeholder="Weight"
          value={form.weight}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <input
          type="number"
          name="volume"
          placeholder="Volume"
          value={form.volume}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        >

          <option>Low</option>

          <option>Medium</option>

          <option>High</option>

        </select>

        <input
          type="date"
          name="delivery_date"
          value={form.delivery_date}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <input
          name="vehicle_type"
          placeholder="Vehicle Type"
          value={form.vehicle_type}
          onChange={handleChange}
          className="border p-4 rounded-xl"
        />

        <button
          className="col-span-2 bg-emerald-600 text-white py-4 rounded-xl"
        >

          Save Shipment

        </button>

      </form>

      <ShipmentTable
        shipments={shipments}
        onDelete={handleDelete}
      />

    </DashboardLayout>

  );

}