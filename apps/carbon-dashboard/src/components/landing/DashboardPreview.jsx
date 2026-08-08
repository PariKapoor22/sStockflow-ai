import { motion } from "framer-motion";
import {
  Boxes,
  Brain,
  Warehouse,
  Truck,
  Route,
  Leaf,
  FileBarChart2,
  ArrowDown,
} from "lucide-react";

const flow = [
  {
    icon: Boxes,
    title: "Inventory",
    desc: "Real-time stock monitoring",
  },
  {
    icon: Brain,
    title: "AI Engine",
    desc: "Demand prediction & recommendations",
  },
  {
    icon: Warehouse,
    title: "Warehouse",
    desc: "Smart inventory balancing",
  },
  {
    icon: Truck,
    title: "Fleet",
    desc: "Vehicle utilization tracking",
  },
  {
    icon: Route,
    title: "Route AI",
    desc: "Shortest & greenest path",
  },
  {
    icon: Leaf,
    title: "Carbon",
    desc: "Automatic CO₂ calculation",
  },
  {
    icon: FileBarChart2,
    title: "Reports",
    desc: "ESG & sustainability reports",
  },
];

export default function DashboardPreview() {
  return (
    <section className="py-28 bg-slate-50">

      <div className="max-w-7xl mx-auto px-8">

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >

          <h2 className="text-5xl font-bold text-center">

            One Platform.
            <br />
            Everything Connected.

          </h2>

          <p className="text-center text-slate-500 mt-6 max-w-3xl mx-auto">

            StockFlow AI connects inventory, warehouses, fleet,
            logistics, carbon emissions and ESG reporting into
            one intelligent ecosystem.

          </p>

        </motion.div>

        <div className="mt-20 grid md:grid-cols-7 gap-6">

          {flow.map((item, index) => {

            const Icon = item.icon;

            return (

              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-3xl p-6 border shadow-sm text-center"
              >

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex justify-center items-center">

                  <Icon className="text-emerald-600" size={28} />

                </div>

                <h3 className="font-bold mt-5">

                  {item.title}

                </h3>

                <p className="text-sm text-slate-500 mt-2">

                  {item.desc}

                </p>

                {index !== flow.length - 1 && (

                  <ArrowDown
                    className="hidden md:block absolute -right-7 top-1/2 text-slate-300"
                    size={20}
                  />

                )}

              </motion.div>

            );

          })}

        </div>

      </div>

    </section>
  );
}