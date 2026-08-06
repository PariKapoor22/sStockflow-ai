import DashboardLayout from "../layouts/DashboardLayout";

export default function Sustainability() {
  return (
    <DashboardLayout>
      <div className="p-8">

        <h1 className="text-4xl font-bold text-slate-800">
          Sustainability Dashboard
        </h1>

        <p className="mt-4 text-slate-500">
          View sustainability insights and environmental performance.
        </p>

      </div>
    </DashboardLayout>
  );
}