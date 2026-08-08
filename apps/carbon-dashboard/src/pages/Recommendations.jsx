import DashboardLayout from "../layouts/DashboardLayout";

export default function Recommendations() {
  return (
    <DashboardLayout>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

        <h1 className="text-4xl font-bold">
          🤖 AI Recommendations
        </h1>

        <p className="text-slate-500 mt-3">
          This module is currently being rebuilt.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

          <div className="bg-green-50 rounded-2xl p-6">
            <h2 className="font-bold text-xl">
              Transfer Recommendation
            </h2>

            <p className="mt-3">
              Move 500 units from Chennai Warehouse to Bangalore Warehouse.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6">
            <h2 className="font-bold text-xl">
              Route Optimization
            </h2>

            <p className="mt-3">
              AI found a route that reduces travel by 42 km.
            </p>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-6">
            <h2 className="font-bold text-xl">
              Sustainability
            </h2>

            <p className="mt-3">
              Estimated carbon reduction: 18 kg CO₂.
            </p>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}