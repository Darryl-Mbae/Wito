import React, { useState } from "react";
import { ChevronDown, BookOpen, Mail } from "lucide-react";

const faqs = [
  {
    q: "How do I create a new event?",
    a: "Go to the Events page and click 'New Event'. Fill in the details and publish when ready.",
  },
  {
    q: "How do I add members to a Chama group?",
    a: "Open the Chama group, click 'Manage Members', then invite via email or share the group link.",
  },
  {
    q: "Can I export attendance records?",
    a: "Yes — on the Events > Attendance tab, use the Export button to download a CSV.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Head to Settings > Billing and click 'Upgrade Plan' to see available options.",
  },
];

const HelpSupport: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
        <p className="text-sm text-gray-500 mt-1">Find answers or reach out to our team.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Documentation", desc: "Browse guides and tutorials", icon: BookOpen },
          { label: "Email Support", desc: "Send us a message", icon: Mail },
        ].map(({ label, desc, icon: Icon }) => (
          <button
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs text-left hover:border-[#7877C6]/30 hover:shadow-sm transition cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-[#7877C6]/8 flex items-center justify-center mb-3 group-hover:bg-[#7877C6]/12 transition">
              <Icon size={17} className="text-[#7877C6]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
