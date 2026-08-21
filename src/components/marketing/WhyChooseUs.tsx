import { motion } from "framer-motion";
import { Sparkles, Store, Wand2 } from "lucide-react";
import { fadeUp } from "./motion";

export default function WhyChooseUs() {
  return (
    <section id="features" className="py-20 lg:py-24 bg-[#f8fafc] relative overflow-hidden">
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">
              The template library
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Every flyer starts from something already great
            </h2>
          </div>
          <p className="text-base text-gray-500 leading-relaxed lg:pl-8">
            Skip the blank canvas. Pick a template, swap in your event details, and you're done —
            or open the store and buy a design made by another creator.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="mt-10 lg:mt-12 grid gap-4 md:grid-cols-3"
        >
          <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#7877C6]/10">
              <Wand2 size={16} className="text-[#7877C6]" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No design skill needed</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Choose a template, change the name and date, and your flyer is ready to share.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#7877C6]/10">
              <Store size={16} className="text-[#7877C6]" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">A store, not just a folder</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Browse designs built by other clubs and creators, and buy the ones that fit your event.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-linear-to-br from-[#7877C6] to-[#5b5aa0] p-6 text-white">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={16} className="text-white" />
            </div>
            <h3 className="mt-4 text-base font-semibold">Designers get paid</h3>
            <p className="mt-2 text-sm text-white/78 leading-relaxed">
              Build a template once, list it in the store, and earn every time another organizer buys it.
            </p>
          </div>
        </motion.div>
      </div>

      {/* <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="mt-14 lg:mt-16 relative"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-0 h-[420px] md:h-[520px]">
          {GRID_IMAGES.map((img) => (
            <div key={img.id} className={`relative overflow-hidden group ${img.className}`}>
              <img
                src={img.src}
                alt={img.label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute bottom-3 left-3 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {img.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div> */}
    </section>
  );
}