import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fadeUp } from "./motion";

const FAQS = [
  {
    q: "What is Rada?",
    a: "Rada is an all-in-one platform for clubs and communities to manage events, create flyers, assign tasks, invite directors, and track attendance.",
  },
  {
    q: "Do attendees need an account to register?",
    a: "No. Public event pages let anyone register with their name, email, and phone — no sign-up required.",
  },
  {
    q: "Can I invite other directors to help manage events?",
    a: "Yes. Invite directors by email from the Directors page or during club setup. They accept via a secure link.",
  },
  {
    q: "How do flyer templates work?",
    a: "Choose from layout presets (Instagram post, story, A4 calendar) or build custom HTML/CSS templates. Event data fills in automatically when you generate a flyer.",
  },
  {
    q: "Can I export attendance records?",
    a: "Yes. On any event's detail page, use the Export button to download registrants as a CSV file.",
  },
  {
    q: "Can I sync events with Google or Apple Calendar?",
    a: "Yes. When creating an event, choose to add it to Google Calendar or download an Apple Calendar (.ics) file. You can also email calendar invites to your directors. Registrants get add-to-calendar options after signing up.",
  },
  {
    q: "How does the template store work?",
    a: "Browse templates by post, story, or flyer format and search by tags. Free templates are available to everyone. Premium templates require a Premium plan to purchase and add to your library.",
  },
  {
    q: "Do I need to code to make flyers?",
    a: "No. The flyer builder uses a simple form with fields like event name, date, and location. Pick a template, fill in details, and preview live — developers can still use HTML/CSS templates for full control.",
  },
  {
    q: "Is Rada free?",
    a: "Yes — the Free plan includes unlimited events, registration pages, tasks, directors, attendance tracking, and calendar sync. Premium features like the template store and Canva/Placid integrations require a Premium plan.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-24 bg-[#f8fafc]">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">FAQ</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          custom={1}
          className="space-y-3"
        >
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              layout
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className={`rounded-2xl border overflow-hidden ${
                open === i
                  ? "border-[#7877C6]/35 bg-white shadow-lg shadow-[#7877C6]/10"
                  : "border-gray-100 bg-white"
              }`}
              style={{ transform: `translateY(${open !== null && i > open ? -Math.min((i - open) * 2, 8) : 0}px)` }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/50 transition-colors"
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -6 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
