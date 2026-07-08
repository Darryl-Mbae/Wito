import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck2, Users, Globe, Sparkles, BarChart3 } from "lucide-react";
import { fadeUp } from "./motion";
import {
  EventsMockup,
  DirectorsMockup,
  RegistrationMockup,
  DesignMockup,
  AttendanceMockup,
} from "./mockups/ProductMockups";

const STEPS = [
  {
    id: "create",
    step: "01",
    icon: CalendarCheck2,
    title: "Create the event",
    desc: "Set the date, venue, meeting link, fee, dress code, and poster in one flow.",
    mockup: <EventsMockup />,
  },
  {
    id: "directors",
    step: "02",
    icon: Users,
    title: "Invite your directors",
    desc: "Bring your team in by email so responsibilities are shared early.",
    mockup: <DirectorsMockup />,
  },
  {
    id: "register",
    step: "03",
    icon: Globe,
    title: "Share the registration page",
    desc: "Members and guests register from a clean public page without creating accounts.",
    mockup: <RegistrationMockup />,
  },
  {
    id: "flyer",
    step: "04",
    icon: Sparkles,
    title: "Turn the event into a flyer",
    desc: "Open the flyer builder, prefill details from the event, and export a polished design.",
    mockup: <DesignMockup />,
  },
  {
    id: "attendance",
    step: "05",
    icon: BarChart3,
    title: "Track attendance after the event",
    desc: "Mark who showed up, review registrations, and export CSV records when you need them.",
    mockup: <AttendanceMockup />,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(STEPS[0].id);

  useEffect(() => {
    const sections = STEPS.map((step) => document.getElementById(`how-${step.id}`)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActive(visible.target.id.replace("how-", ""));
        }
      },
      {
        rootMargin: "-25% 0px -35% 0px",
        threshold: [0.2, 0.45, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const activeStep = useMemo(
    () => STEPS.find((step) => step.id === active) ?? STEPS[0],
    [active]
  );

  return (
    <section id="how-it-works" className="relative py-20 lg:py-28 bg-[#f8fafc] overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[#7877C6]/10 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-5 lg:px-8 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="max-w-2xl mx-auto text-center mb-14 lg:mb-20"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">How it works</p>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            From idea to full event flow
          </h2>
          <p className="mt-4 text-sm lg:text-base text-gray-500 leading-relaxed">
            Scroll through the exact journey your club follows inside Rada.
          </p>
        </motion.div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
          <div className="relative">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === active;

              return (
                <section
                  key={step.id}
                  id={`how-${step.id}`}
                  className="min-h-[70vh] flex items-center"
                >
                  <div
                    className={`rounded-3xl border px-6 py-7 transition-all duration-300 ${
                      isActive
                        ? "border-[#7877C6]/30 bg-white shadow-xl shadow-[#7877C6]/8"
                        : "border-transparent bg-transparent opacity-55"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7877C6]/10 text-[#7877C6]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7877C6]/70">{step.step}</p>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed text-gray-500">{step.desc}</p>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="sticky top-28 h-[calc(100vh-9rem)] flex items-center">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {activeStep.mockup}
            </motion.div>
          </div>
        </div>

        <div className="lg:hidden space-y-8">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                className="space-y-4"
              >
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-[#7877C6]/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7877C6]/10 text-[#7877C6]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7877C6]/70">{step.step}</p>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {step.mockup}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
