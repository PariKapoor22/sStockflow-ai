import DashboardLayout from "../layouts/DashboardLayout";

export default function Settings() {
  return (
    <DashboardLayout>

      <h1 className="text-4xl font-bold mb-8">
        Settings
      </h1>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

        <div className="space-y-6">

          <input
            className="w-full border rounded-xl p-4"
            placeholder="Company Name"
          />

          <input
            className="w-full border rounded-xl p-4"
            placeholder="Business Email"
          />

          <select className="w-full border rounded-xl p-4">

            <option>Light Theme</option>

            <option>Dark Theme</option>

          </select>

          <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl">

            Save Settings

          </button>

        </div>

      </div>

    </DashboardLayout>
  );
}