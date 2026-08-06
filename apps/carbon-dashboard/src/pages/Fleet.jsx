import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import FleetStats from "../components/FleetStats";
import VehicleCard from "../components/VehicleCard";
import VehicleModal from "../components/VehicleModal";
import FleetSearch from "../components/FleetSearch";

import {
  getVehicles,
  addVehicle,
  deleteVehicle,
} from "../services/fleetService";

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  async function loadVehicles() {
    try {
      const res = await getVehicles();
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function handleSave(vehicle) {
    try {
      await addVehicle(vehicle);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await deleteVehicle(id);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    return (
      vehicle.vehicle_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      vehicle.vehicle_number
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Fleet Management
          </h1>

          <p className="text-slate-500 mt-2">
            Manage all company vehicles.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold"
        >
          + Add Vehicle
        </button>

      </div>

      <FleetStats vehicles={vehicles} />

      <div className="flex justify-between items-center mb-8">

        <FleetSearch
          value={search}
          onChange={setSearch}
        />

      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {filteredVehicles.length === 0 ? (

          <div className="col-span-3 bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500">
            No vehicles found.
          </div>

        ) : (

          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onDelete={handleDelete}
            />
          ))

        )}

      </div>

      <VehicleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

    </DashboardLayout>
  );
}