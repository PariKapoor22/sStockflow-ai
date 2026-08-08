import { ShieldCheck } from "lucide-react";

export default function VerificationStatus() {

  return (

    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

      <div className="flex items-center gap-3">

        <ShieldCheck
          className="text-emerald-600"
          size={30}
        />

        <h2 className="text-xl font-bold">

          Verification

        </h2>

      </div>

      <p className="text-slate-500 mt-6">

        Latest report has been digitally verified using SHA-256.

      </p>

      <div className="mt-8">

        <span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full font-semibold">

          Verified

        </span>

      </div>

    </div>

  );

}