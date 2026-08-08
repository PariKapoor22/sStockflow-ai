import DashboardLayout from "../layouts/DashboardLayout";

export default function RoutePlanner() {
  return (
    <DashboardLayout>
      <div className="p-8">

        <h1 className="text-4xl font-bold text-slate-800">
          Route Planner
        </h1>

        <p className="mt-4 text-slate-500">
          Optimize delivery routes and reduce carbon emissions.
        </p>

      </div>
    </DashboardLayout>
  );
}