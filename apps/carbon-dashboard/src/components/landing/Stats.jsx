import { motion } from "framer-motion";

const stats = [
  {
    value: "10K+",
    title: "Businesses",
    desc: "Using our platform worldwide",
  },
  {
    value: "98%",
    title: "AI Accuracy",
    desc: "Demand & inventory prediction",
  },
  {
    value: "35%",
    title: "Carbon Reduction",
    desc: "Average emission savings",
  },
  {
    value: "₹2.8Cr",
    title: "Logistics Saved",
    desc: "Operational cost reduction",
  },
];

export default function Stats() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <div className="grid md:grid-cols-4 gap-8">

          {stats.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="bg-slate-50 rounded-2xl p-8 border"
            >
              <h2 className="text-5xl font-bold text-emerald-600">
                {item.value}
              </h2>

              <h3 className="font-semibold mt-4 text-xl">
                {item.title}
              </h3>

              <p className="text-slate-500 mt-2">
                {item.desc}
              </p>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}