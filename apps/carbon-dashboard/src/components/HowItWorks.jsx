import {
  Database,
  Calculator,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: <Database size={32} />,
    title: "Collect Business Data",
    desc: "Enter electricity usage, transport, fuel consumption and operational data.",
  },
  {
    icon: <Calculator size={32} />,
    title: "Calculate Emissions",
    desc: "The platform automatically calculates CO₂ emissions using standardized emission factors.",
  },
  {
    icon: <BarChart3 size={32} />,
    title: "Analyze Performance",
    desc: "Track monthly emissions, identify hotspots and monitor sustainability progress.",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Verify & Report",
    desc: "Generate reports and securely verify records with cryptographic signatures.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 bg-slate-50">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <p className="text-emerald-600 font-semibold uppercase tracking-widest">
            Workflow
          </p>

          <h2 className="text-4xl font-bold mt-3 text-slate-900">
            How the Platform Works
          </h2>

          <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
            A simple four-step workflow that enables MSMEs to measure,
            monitor and verify their carbon footprint efficiently.
          </p>

        </div>

        <div className="grid lg:grid-cols-4 gap-8 mt-20">

          {steps.map((step, index) => (

            <div
              key={index}
              className="relative bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300"
            >

              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">

                {step.icon}

              </div>

              <div className="mt-6 text-sm font-bold text-emerald-600">

                STEP {index + 1}

              </div>

              <h3 className="mt-3 text-xl font-bold">

                {step.title}

              </h3>

              <p className="mt-4 text-slate-600 leading-7">

                {step.desc}

              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}