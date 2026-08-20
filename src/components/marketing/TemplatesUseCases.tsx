import { motion } from "framer-motion";
import { fadeUp } from "./motion";

const TEMPLATES = [
  {
    name: "Instagram Post",
    size: "1080 × 1080",
    preview: "aspect-square",
    gradient: "from-[#7877C6]/20 to-[#a5a4e0]/30",
  },
  {
    name: "Instagram Story",
    size: "1080 × 1920",
    preview: "aspect-[9/16] max-h-48",
    gradient: "from-emerald-100 to-emerald-50",
  },
  {
    name: "Event Calendar A4",
    size: "Print ready",
    preview: "aspect-[3/4] max-h-48",
    gradient: "from-amber-50 to-orange-50",
  },
];

const USE_CASES = [
  { label: "University clubs", emoji: "🎓" },
  { label: "Chama groups", emoji: "🤝" },
  { label: "Community events", emoji: "🌍" },
  { label: "Youth organizations", emoji: "✨" },
  { label: "Professional associations", emoji: "💼" },
  { label: "Cultural societies", emoji: "🎭" },
];

export default function TemplatesUseCases() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Templates</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Layouts for every channel
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Start with presets for social and print, then customize with your brand.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <div key={t.name} className="group cursor-default">
                  <div className={`${t.preview} rounded-xl bg-linear-to-br ${t.gradient} border border-gray-100 flex items-center justify-center overflow-hidden mb-2 group-hover:border-[#7877C6]/30 transition-colors`}>
                    <div className="text-center p-2">
                      <p className="text-[7px] font-bold text-[#7877C6] uppercase">Invited</p>
                      <p className="text-[9px] font-bold text-gray-800 mt-0.5">Your Event</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800">{t.name}</p>
                  <p className="text-[9px] text-gray-400">{t.size}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <img src="/images/canva-icon.webp" alt="Canva" className="h-6 w-6 rounded" />
              <img src="/images/placid-icon.webp" alt="Placid" className="h-6 w-6 rounded" />
              <span className="text-xs text-gray-400">+ Template store with search &amp; tags</span>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={1}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Use cases</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Built for real communities
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              From campus clubs to chama groups — Wito fits how East African communities actually organize.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.label}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 hover:border-[#7877C6]/20 transition-colors"
                >
                  <span className="text-lg">{uc.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{uc.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
