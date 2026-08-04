import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "How it Works", href: "#workflow" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/images/logo.png" alt="Wito" className="h-6 w-auto" />
          <span className="text-lg font-bold text-gray-900 tracking-tight">Wito</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-[#7877C6] transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-xl bg-[#7877C6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6b6ab3] transition-colors"
          >
            Get started free
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-4 space-y-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-sm font-medium text-gray-700"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link to="/auth" className="text-center py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl">
                  Sign in
                </Link>
                <Link to="/auth" className="text-center py-2.5 text-sm font-semibold text-white bg-[#7877C6] rounded-xl">
                  Get started free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
