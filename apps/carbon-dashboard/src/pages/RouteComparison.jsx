import DashboardLayout from "../layouts/DashboardLayout";

export default function RouteComparison() {
  return (
    <DashboardLayout>
      <div className="p-8">

        <h1 className="text-4xl font-bold text-slate-800">
          Route Comparison
        </h1>

        <p className="mt-4 text-slate-500">
          Compare optimized routes and carbon savings.
        </p>

      </div>
    </DashboardLayout>
  );
}