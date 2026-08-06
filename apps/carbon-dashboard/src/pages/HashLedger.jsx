import DashboardLayout from "../layouts/DashboardLayout";

export default function HashLedger() {
  return (
    <DashboardLayout>
      <div className="p-8">

        <h1 className="text-4xl font-bold text-slate-800">
          Hash Ledger
        </h1>

        <p className="mt-4 text-slate-500">
          Blockchain verification records will appear here.
        </p>

      </div>
    </DashboardLayout>
  );
}