import { motion } from "framer-motion";
import { fadeUp, stagger } from "./motion";

const TESTIMONIALS = [
  {
    quote: "We used to manage events in WhatsApp groups and Google Sheets. Wito cut our planning time in half.",
    name: "Sarah Wanjiku",
    role: "President, Future Leaders Association",
    avatar: "S",
    color: "#7877C6",
  },
  {
    quote: "The flyer generator is a game-changer. I create an Instagram post in under a minute after setting up an event.",
    name: "James Ochieng",
    role: "Events Lead, Nairobi Tech Club",
    avatar: "J",
    color: "#1D9E75",
  },
  {
    quote: "Inviting directors and assigning tasks finally feels organized. Everyone knows what they're responsible for.",
    name: "Amina Hassan",
    role: "Secretary, Campus Connect",
    avatar: "A",
    color: "#3B82F6",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7877C6] mb-3">Testimonials</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Loved by club organizers
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-5 lg:gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="rounded-2xl border border-gray-100 bg-white p-7 flex flex-col hover:shadow-lg hover:shadow-[#7877C6]/5 transition-shadow"
            >
              <p className="text-sm text-gray-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-50">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
