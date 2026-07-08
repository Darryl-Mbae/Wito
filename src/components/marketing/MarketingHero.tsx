import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { fadeUp, stagger } from "./motion";
import { CalendarMockup, EventsMockup, DesignMockup } from "./mockups/ProductMockups";

const TABS = [
  { id: "calendar", label: "Calendar", component: CalendarMockup },
  { id: "events", label: "Events", component: EventsMockup },
  { id: "design", label: "Design", component: DesignMockup },
] as const;

export default function MarketingHero() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("calendar");

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="absolute inset-0 -z-10 h-screen w-[100vw] bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#7877C6]/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#a5a4e0]/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #7877C6 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-5 lg:px-8 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-[#7877C6]/20 bg-[#7877C6]/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7877C6] animate-pulse" />
            <span className="text-xs font-medium text-[#7877C6]">Built for clubs and communities</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.08]"
          >
            Plan events. <span className="inline-block">✨</span>
            <br className="sm:block" />
            Promote beautifully.
            <br className="sm:block" /> Stay organized.
            {" "}
            <span className="bg-linear-to-r from-[#7877C6] to-[#5b5aa0] bg-clip-text text-transparent">
              <br className="md:hidden" /> All in Wito.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="mt-5 text-base sm:text-lg text-gray-500 w-[80%] md:max-w-xl mx-auto leading-relaxed">
            Events, flyers, registrations and calendar sync in one clean workspace.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#7877C6] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#6b6ab3] transition-all  hover:shadow-[#7877C6]/35"
            >
              Get started free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 backdrop-blur-sm px-7 py-3.5 text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
            >
              <Play size={14} className="text-[#7877C6]" />
              See how it works
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* <div className="flex justify-center gap-2 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  active === tab.id
                    ? "bg-[#7877C6] text-white shadow-md shadow-[#7877C6]/25"
                    : "bg-white/80 text-gray-500 border border-gray-200 hover:border-[#7877C6]/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div> */}

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative mx-auto max-w-4xl flex items-center justify-center gap-6"
          >
            <div className="absolute -inset-4 rounded-3xl bg-linear-to-b from-[#7877C6]/10 to-transparent blur-xl -z-10" />
            {/* <img src="/images/phone.png" alt="Phone" className="absolute top-4 right-10 w-[25%] h-auto object-contain" /> */}
            <img src="/images/mac.png" alt="Mac" className="w-full h-auto object-contain" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
