import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { fadeUp, stagger } from "./motion";

const PLANS = [
  {
    name: "Free",
    price: "KES 0",
    period: "forever",
    desc: "Everything you need to get your club organized.",
    cta: "Get started free",
    featured: false,
    features: [
      "Unlimited events",
      "Public registration pages",
      "HTML flyer templates",
      "Template store ( Earn credits selling your templates )",
      "Task and Event management",
      "Director invitations",
      "Attendance tracking",
      "Google Calendar sync",
      // "100 emails / month",
      "500 MB media storage",
    ],
  },
  {
    name: "Premium",
    price: "Coming soon",
    period: "",
    desc: "Advanced tools for growing organizations.",
    cta: "Join waitlist",
    featured: true,
    features: [
      "Everything in Free",
      // "1,000 emails / month",
      "10 GB media storage",
      "Custom fonts on templates",
      "Private tasks",
      "CSV export",
      "Send custom emails to event registered users",
      "Priority support",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-[#f8fafc]">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Pricing</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Free to start, premium when you&apos;re ready
          </h2>
          <p className="mt-4 text-gray-500">No credit card required. Upgrade when you need advanced integrations.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.featured
                  ? "bg-linear-to-br from-[#7877C6] to-[#5b5aa0] text-white shadow-xl shadow-[#7877C6]/25"
                  : "bg-white border border-gray-100"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#7877C6] shadow-sm">
                  <Sparkles size={10} />
                  Most popular
                </div>
              )}

              <h3 className={`text-lg font-bold ${plan.featured ? "text-white" : "text-gray-900"}`}>
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${plan.featured ? "text-white" : "text-gray-900"}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.featured ? "text-white/70" : "text-gray-400"}`}>
                    / {plan.period}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm ${plan.featured ? "text-white/80" : "text-gray-500"}`}>
                {plan.desc}
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      className={`shrink-0 mt-0.5 ${plan.featured ? "text-white/90" : "text-[#7877C6]"}`}
                    />
                    <span className={plan.featured ? "text-white/90" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={`mt-8 block text-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                  plan.featured
                    ? "bg-white text-[#7877C6] hover:bg-white/90"
                    : "bg-[#7877C6] text-white hover:bg-[#6b6ab3]"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
