import { motion } from "framer-motion";
import { Calendar, Store, Sparkles } from "lucide-react";
import { fadeUp } from "./motion";

export default function NewFeaturesBanner() {
  const features = [
    {
      icon: Calendar,
      title: "Google & Apple Calendar",
      desc: "Sync events when you create them, invite directors, and let registrants add events to their calendar.",
    },
    {
      icon: Sparkles,
      title: "Full-page flyer builder",
      desc: "Create flyers from any event with a simple form — event details pre-fill automatically. No code required.",
    },
    {
      icon: Store,
      title: "Template store",
      desc: "Browse post, story, and flyer templates with search and tags. Premium templates for Pro plans.",
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-white border-y border-gray-100">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">What&apos;s new</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Built for how organizers actually work
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i * 0.1}
                className="rounded-2xl border border-gray-100 p-6 lg:p-7 hover:border-[#7877C6]/20 hover:shadow-lg hover:shadow-[#7877C6]/5 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-[#7877C6]/8 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#7877C6]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
