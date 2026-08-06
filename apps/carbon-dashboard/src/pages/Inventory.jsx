import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

import InventoryStats from "../components/InventoryStats";
import InventoryCard from "../components/InventoryCard";
import InventoryModal from "../components/InventoryModal";

import {
  getInventory,
  addInventory,
  deleteInventory,
} from "../services/inventoryService";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function loadInventory() {
    try {
      const res = await getInventory();
      setInventory(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function handleSave(item) {
    try {
      await addInventory(item);
      loadInventory();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this inventory item?")) return;

    try {
      await deleteInventory(id);
      loadInventory();
    } catch (error) {
      console.error(error);
    }
  }

  const filteredInventory = inventory.filter((item) => {
    return (
      item.product_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.sku
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.warehouse
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout>

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold text-slate-800">

            Inventory Management

          </h1>

          <p className="text-slate-500 mt-2">

            Monitor warehouse inventory and stock levels.

          </p>

        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold"
        >
          + Add Inventory
        </button>

      </div>

      <InventoryStats inventory={inventory} />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">

        <input
          type="text"
          placeholder="Search by Product, SKU or Warehouse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-xl p-4"
        />

      </div>

      {filteredInventory.length === 0 ? (

        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">

          <h2 className="text-2xl font-bold">

            No Inventory Found

          </h2>

          <p className="text-slate-500 mt-3">

            Add inventory to begin monitoring stock.

          </p>

        </div>

      ) : (

        <div className="grid lg:grid-cols-3 gap-6">

          {filteredInventory.map((item) => (

            <InventoryCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}

      <InventoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

    </DashboardLayout>
  );
}