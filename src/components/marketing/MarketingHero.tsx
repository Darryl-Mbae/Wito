import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { fadeUp, stagger } from "./motion";
import {
  CalendarMockup,
  EventsMockup,
  DesignMockup,
} from "./mockups/ProductMockups";

const TABS = [
  { id: "calendar", label: "Calendar", component: CalendarMockup },
  { id: "events", label: "Events", component: EventsMockup },
  { id: "design", label: "Design", component: DesignMockup },
] as const;

export default function MarketingHero() {
  const [active] = useState<(typeof TABS)[number]["id"]>("calendar");

  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Desktop-only scroll animation
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24"
    >
      <div className="absolute inset-0 z-0 h-screen w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-20 mx-auto max-w-6xl px-5 lg:px-8 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-[#7877C6]/20 bg-[#7877C6]/5 px-4 py-1.5 mb-6"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#7877C6] animate-pulse" />
            <span className="text-xs font-medium text-[#7877C6]">
              Built for clubs and communities
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.08]"
          >
            Plan events. ✨
            <br />
            Promote beautifully.
            <br />
            Stay organized.
            <span className="bg-gradient-to-r from-[#7877C6] to-[#5b5aa0] bg-clip-text text-transparent">
              <br className="md:hidden" /> All in Wito.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 text-base sm:text-lg text-gray-500 w-[80%] md:max-w-xl mx-auto leading-relaxed"
          >
            Events, flyers, registrations and calendar sync in one clean
            workspace.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#7877C6] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#6b6ab3] transition-all"
            >
              Get started free
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
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

        {/* Desktop */}
        <motion.div
          style={{ scale, y }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-10 relative mx-auto max-w-4xl origin-center hidden lg:block"
        >
          <img
            src="/images/mac.png"
            alt="Mac"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mx-auto max-w-4xl lg:hidden"
        >
          <img
            src="/images/mac.png"
            alt="Mac"
            className="w-full h-auto object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
}