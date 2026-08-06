import DashboardLayout from "../layouts/DashboardLayout";
import { generateHash } from "../utils/hashGenerator";

export default function Verification() {

  const sampleData = {
    company: "Green Industries",
    month: "August 2026",
    totalEmission: 1878.9,
    carbonScore: 82,
  };

  const hash = generateHash(sampleData);

  return (
    <DashboardLayout>

      <h1 className="text-4xl font-bold mb-8">
        Verification
      </h1>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

        <h2 className="text-2xl font-bold">
          Digital Verification
        </h2>

        <p className="text-slate-500 mt-2">
          SHA-256 fingerprint of the emission record.
        </p>

        <div className="mt-8 bg-slate-100 rounded-xl p-5 break-all font-mono text-sm">

          {hash}

        </div>

        <div className="mt-8 flex justify-between items-center">

          <span className="text-emerald-600 font-semibold">
            ✔ Verified
          </span>

          <button
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700"
            onClick={() => navigator.clipboard.writeText(hash)}
          >
            Copy Hash
          </button>

        </div>

      </div>

    </DashboardLayout>
  );
}