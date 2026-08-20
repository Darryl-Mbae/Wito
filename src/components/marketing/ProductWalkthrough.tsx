import { motion } from "framer-motion";
import { fadeUp, slideInLeft, slideInRight } from "./motion";
import {
  CalendarMockup,
  RegistrationMockup,
  AttendanceMockup,
  DesignMockup,
} from "./mockups/ProductMockups";

const STEPS = [
  {
    step: "01",
    title: "Plan on your calendar",
    desc: "See every event and task in one monthly view.",
    mockup: <CalendarMockup />,
    align: "left" as const,
  },
  {
    step: "02",
    title: "Share a public registration page",
    desc: "Members and guests sign up — no account needed.",
    mockup: <RegistrationMockup />,
    align: "right" as const,
  },
  {
    step: "03",
    title: "Track attendance in real time",
    desc: "Toggle check-ins and export your list to CSV.",
    mockup: <AttendanceMockup />,
    align: "left" as const,
  },
  {
    step: "04",
    title: "Sync with Google & Apple Calendar",
    desc: "Add events to your calendar on create, invite directors, and let registrants save the date.",
    mockup: <CalendarMockup />,
    align: "right" as const,
  },
  {
    step: "05",
    title: "Create a flyer in one click",
    desc: "From any event, open the flyer builder — details pre-fill from your event.",
    mockup: <DesignMockup />,
    align: "left" as const,
  },
];

export default function ProductWalkthrough() {
  return (
    <section id="walkthrough" className="py-24 lg:py-32 bg-[#f8fafc]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Product walkthrough</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            From planning to packed events
          </h2>
          <p className="mt-4 text-gray-500">Every step happens inside Wito — no switching tools.</p>
        </motion.div>

        <div className="space-y-24 lg:space-y-32">
          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                s.align === "right" ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={s.align === "left" ? slideInLeft : slideInRight}
              >
                <span className="text-xs font-bold text-[#7877C6]/60 tracking-widest">{s.step}</span>
                <h3 className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{s.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                custom={i * 0.1}
              >
                {s.mockup}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
