import { motion } from "framer-motion";
import {  ArrowRight } from "lucide-react";
import { fadeUp } from "./motion";
import { Link } from "react-router-dom";

import movie from '../../assets/movie.png'
import comedy from '../../assets/comedy.png'
import beat from '../../assets/beat.png'
import open from '../../assets/open.png'
import thankyou from '../../assets/thankyou.png'
import birthday from '../../assets/birthdat.png'

const TEMPLATES = [
  {
    id: "t1",
    src: open,
    h: "h-74",
  },
  {
    id: "t2",
    src: comedy,
    h: "h-90",
  },
  {
    id: "t3",
    src: birthday,
    h: "h-90",
  },
  {
    id: "t4",
    src: movie,
    h: "h-72",
  },
  {
    id: "t5",
    src: thankyou,
    h: "h-70",
  },
  {
    id: "t6",
    src: beat,
    h: "h-82",
  },
];

const COL_A = [TEMPLATES[0], TEMPLATES[1], TEMPLATES[2]];
const COL_B = [TEMPLATES[3], TEMPLATES[4], TEMPLATES[5]];

export default function TemplateGallery() {
  return (
    <section id="templates" className="relative max-w-6xl mx-auto  overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 items-center">
          {/* Left column */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="flex flex-col"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7877C6]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
      // The library
              </p>
            </div>

            <h2 className="flex flex-col text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
              <span>Discover.</span>
              <span className="text-[#7877C6]">Customize.</span>
              <span>Share.</span>

            </h2>

            <p className="mt-6 text-base text-gray-500 leading-relaxed max-w-md">
              Every template is ready to drop your event into. Browse designs from
              other organizers and creators, or list your own and get paid when
              someone uses it.
            </p>

            <div className="mt-8 flex items-center gap-4">
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
            </div>

            
          </motion.div>

          {/* Right column — masonry gallery */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex flex-col gap-4">
              {COL_A.map((t) => (
                <div key={t.id} className={`overflow-hidden rounded-2xl ${t.h}`}>
                  <img src={t.src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 pt-10">
              {COL_B.map((t) => (
                <div key={t.id} className={`overflow-hidden rounded-2xl ${t.h}`}>
                  <img src={t.src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}