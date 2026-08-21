import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Building2, CalendarCheck, Palette, Link2, BarChart3, LayoutTemplate } from "lucide-react";
import { fadeUp } from "./motion";


const FEATURES = [
  {
    id: "org",
    icon: Building2,
    tag: "Step 01",
    image: "/images/create.png",
    imageStyle: "w-full h-full object-cover lg:mb-7",
    title: "Create your org",
    desc: "Set up your organization first so everything lives in one branded workspace.",
  },
  {
    id: "event",
    icon: CalendarCheck,
    tag: "Step 02",
    image: "/images/event.png",
    imageStyle: "h-full w-auto object-cover",
    title: "Create event",
    desc: "Add the date, venue, fee, meeting link, dress code, and all the key event details in one flow.",
  },
  {
    id: "templates",
    icon: LayoutTemplate,
    tag: "Step 03",
    image: "/images/templates.png",
    imageStyle: "h-full w-auto object-cover",
    title: "Pick a template",
    desc: "Choose from a library of ready-to-go flyer templates, so you're never starting from a blank canvas.",
  },
  {
    id: "flyer",
    icon: Palette,
    tag: "Step 04",
    image: "#",
    imageStyle: "w-full h-full object-cover",
    title: "Generate flyer",
    desc: "No design time needed — just swap in your event name and details, and your flyer is ready.",
  },
  {
    id: "share",
    icon: Link2,
    tag: "Step 05",
    image: "#",
    imageStyle: "h-full w-auto object-cover",
    title: "Share registration links",
    desc: "Send your public event page so members and guests can register without creating an account.",
  },
  {
    id: "attendance",
    icon: BarChart3,
    tag: "Step 06",
    image: "/images/attendance.png",
    imageStyle: "h-full w-auto object-cover",
    title: "Track attendance",
    desc: "Review registrations, mark attendance, and export records after the event is done.",
  },
];

export default function FeatureSections() {
  const targetRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Shift less aggressively so each scroll stage can frame roughly two cards at a time.
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-58%"]);

  return (
    // Height controls scroll "distance" — more height = slower/longer horizontal scroll.
    // 6 cards → 300vh feels about right. Tune to taste.
    <section id="workflow" className="relative py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">
            How it works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Scroll through the full event workflow
          </h2>
          <p className="mt-3 text-sm text-gray-500">From setting up your org to tracking attendance after the event.</p>
        </motion.div>
      </div>

      <div className="lg:hidden">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 w-full">
          <div
            ref={mobileTrackRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const cardWidth = el.clientWidth;
              const nextIndex = Math.round(el.scrollLeft / cardWidth);
              setActiveMobileIndex(Math.max(0, Math.min(FEATURES.length - 1, nextIndex)));
            }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.id}
                  className="snap-center shrink-0 w-full rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_20px_60px_rgba(120,119,198,0.08)]"
                >
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#7877C6]/8 px-3 py-1.5 mb-3">
                    <Icon size={14} className="text-[#7877C6]" />
                    <span className="text-xs font-semibold text-[#7877C6]">{f.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed mb-5">{f.desc}</p>
                  <div className="rounded-[1.75rem] aspect-[16/10] flex items-center ">
                    <img src={f.image} alt={f.title} className={f.imageStyle} />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mt-5">
            {FEATURES.map((feature, index) => (
              <button
                key={feature.id}
                type="button"
                aria-label={`Go to ${feature.title}`}
                onClick={() => {
                  const track = mobileTrackRef.current;
                  if (!track) return;
                  track.scrollTo({
                    left: track.clientWidth * index,
                    behavior: "smooth",
                  });
                  setActiveMobileIndex(index);
                }}
                className={`h-2.5 rounded-full transition-all ${activeMobileIndex === index
                    ? "w-6 bg-[#7877C6]"
                    : "w-2.5 bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      <section ref={targetRef} className="relative hidden lg:block" style={{ height: "240vh" }}>
        <div className="sticky top-0 flex flex-col justify-center overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 lg:px-8 w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center max-w-2xl mx-auto"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-transparent mb-3">
                spacer
              </p>
            </motion.div>
          </div>

          <div className="w-full overflow-hidden">
            <motion.div
              style={{ x }}
              className="pt-15 flex gap-6 pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] pr-[18vw] lg:pr-[18vw] w-max"
            >
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <article
                    key={f.id}
                    className="shrink-0 w-[78vw] sm:w-[42rem] lg:w-[38rem] rounded-[2rem] border border-gray-200 bg-white p-6 lg:p-7 lg:pb-0"
                  >
                    <div className="inline-flex items-center gap-2 rounded-lg bg-[#7877C6]/8 px-3 py-1.5 mb-3">
                      <Icon size={14} className="text-[#7877C6]" />
                      <span className="text-xs font-semibold text-[#7877C6]">{f.tag}</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed mb-5">{f.desc}</p>
                    <div className="rounded-[1.75rem] aspect-[16/10] flex items-center ">
                      <img src={f.image} alt={f.title} className={f.imageStyle} />
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>
    </section>
  );
}