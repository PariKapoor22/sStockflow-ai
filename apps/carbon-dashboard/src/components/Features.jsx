import {
  Leaf,
  BarChart3,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: <Leaf size={32} />,
    title: "Carbon Tracking",
    description:
      "Measure electricity, transport, fuel and operational emissions accurately.",
  },
  {
    icon: <BarChart3 size={32} />,
    title: "Analytics Dashboard",
    description:
      "Visualize carbon trends, reduction progress and sustainability performance.",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Secure Verification",
    description:
      "Verify reports with cryptographic signatures for authenticity and trust.",
  },
  {
    icon: <TrendingUp size={32} />,
    title: "AI Recommendations",
    description:
      "Receive intelligent suggestions to reduce emissions and improve efficiency.",
  },
];

export default function Features() {
  return (
    <section className="bg-white py-24">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <p className="text-emerald-600 font-semibold uppercase tracking-widest">
            Features
          </p>

          <h2 className="text-4xl font-bold mt-3 text-slate-900">
            Everything you need to manage
            <br />
            your carbon footprint
          </h2>

          <p className="mt-6 text-slate-600 max-w-2xl mx-auto leading-8">
            A single platform for measuring, monitoring,
            verifying and improving sustainability across
            your organization.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

          {features.map((item, index) => (

            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >

              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">

                {item.icon}

              </div>

              <h3 className="text-xl font-bold mt-6">
                {item.title}
              </h3>

              <p className="text-slate-600 mt-4 leading-7">
                {item.description}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}