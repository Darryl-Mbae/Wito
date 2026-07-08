import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { fadeUp } from "./motion";

const POINTS = [
  "One product for events, flyers, directors, registrations, and attendance.",
  "Less back-and-forth between chats, spreadsheets, and design tools.",
  "A cleaner experience for both organizers and attendees.",
  "Built around actual community workflows, not generic project management.",
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-24 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7877C6]/7 blur-[120px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-[#a5a4e0]/10 blur-[100px] -z-0" />

      <div className="mx-auto max-w-6xl px-5 lg:px-8 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Why Rada</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Made for clubs that care about both execution and presentation
            </h2>
          </div>
          <p className="text-base text-gray-500 leading-relaxed lg:pl-8">
            Rada is not trying to be a generic workspace. It is focused on the exact things community organizers repeat every month.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mt-10 lg:mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 lg:p-8 shadow-xl shadow-[#7877C6]/5">
            <div className="grid gap-4 md:grid-cols-2">
              {POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl bg-[#f8fafc] p-4">
                  <CheckCircle2 size={18} className="text-[#7877C6] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-linear-to-br from-[#7877C6] to-[#5b5aa0] p-6 lg:p-8 text-white shadow-2xl shadow-[#7877C6]/20">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/65">The difference</p>
            <h3 className="mt-4 text-2xl font-bold tracking-tight">Organize faster. Look sharper.</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/78">
              Instead of stitching five tools together, your club runs the full event cycle from one polished system.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
