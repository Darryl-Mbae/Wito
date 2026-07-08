import { motion } from "framer-motion";
import { fadeUp } from "./motion";

const STATS = [
  { value: "500+", label: "Events managed" },
  { value: "2,000+", label: "Registrations" },
  { value: "150+", label: "Clubs & communities" },
  { value: "98%", label: "Organizer satisfaction" },
];

const LOGOS = [
  "Future Leaders",
  "Nairobi Tech Club",
  "Campus Connect",
  "Chama United",
  "Youth Forum",
  "Design Collective",
];

export default function SocialProof() {
  return (
    <section className="py-16 lg:py-20 border-y border-gray-100 bg-white/50">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8"
        >
          Trusted by organizers across East Africa
        </motion.p>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={1}
          className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-14"
        >
          {LOGOS.map((name) => (
            <span key={name} className="text-sm font-semibold text-gray-300 hover:text-gray-400 transition-colors">
              {name}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={2}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
