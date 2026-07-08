import { motion } from "framer-motion";
import { fadeUp, stagger } from "./motion";

const STEPS = [
  {
    num: "1",
    title: "Create your club",
    desc: "Sign up, name your organization, and invite directors.",
  },
  {
    num: "2",
    title: "Plan your events",
    desc: "Add dates, venues, fees, and cover images.",
  },
  {
    num: "3",
    title: "Promote & register",
    desc: "Generate flyers and share your public registration link.",
  },
  {
    num: "4",
    title: "Run the show",
    desc: "Track attendance, complete tasks, and export records.",
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-24 lg:py-32 bg-[#f8fafc]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Workflow</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Up and running in minutes
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {STEPS.map((s, i) => (
            <motion.div key={s.num} variants={fadeUp} custom={i * 0.1} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-linear-to-r from-[#7877C6]/30 to-[#7877C6]/10" />
              )}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 h-full hover:border-[#7877C6]/20 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#7877C6] flex items-center justify-center text-sm font-bold text-white mb-4">
                  {s.num}
                </div>
                <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
