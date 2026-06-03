import React, { useState } from "react";
import { User, Bell, Shield, CreditCard } from "lucide-react";

const sections = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Update your name, email, and profile photo.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Choose what you get notified about.",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Manage your password and two-factor authentication.",
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    description: "View your plan, invoices, and payment methods.",
  },
];

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState("profile");

  const current = sections.find((s) => s.id === activeSection)!;
  const Icon = current.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="md:w-52 shrink-0">
          <nav className="rounded-2xl border border-gray-100 bg-white p-2 shadow-xs space-y-1">
            {sections.map(({ id, label, icon: SectionIcon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition cursor-pointer
                  ${activeSection === id
                    ? "bg-[#7877C6]/8 text-[#7877C6]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <SectionIcon size={16} className={activeSection === id ? "text-[#7877C6]" : "text-gray-400"} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="h-9 w-9 rounded-xl bg-[#7877C6]/8 flex items-center justify-center">
              <Icon size={17} className="text-[#7877C6]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{current.label}</h3>
              <p className="text-xs text-gray-400">{current.description}</p>
            </div>
          </div>

          {/* Placeholder form area */}
          <div className="space-y-4">
            {activeSection === "profile" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition"
                  />
                </div>
                <button className="rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer">
                  Save Changes
                </button>
              </>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-3">
                {["Email notifications", "Push notifications", "Weekly digest", "Event reminders"].map((item) => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{item}</span>
                    <div className="h-5 w-9 rounded-full bg-[#7877C6] relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "security" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-[8px] border border-gray-200 bg-white/70 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#7877C6]/20 transition"
                  />
                </div>
                <button className="rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer">
                  Update Password
                </button>
              </>
            )}

            {activeSection === "billing" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#7877C6]/20 bg-[#7877C6]/5 p-4">
                  <p className="text-xs font-medium text-[#7877C6] uppercase tracking-wide mb-1">Current Plan</p>
                  <p className="text-sm font-semibold text-gray-900">Free Tier</p>
                  <p className="text-xs text-gray-400 mt-0.5">Upgrade to unlock all features.</p>
                </div>
                <button className="rounded-[8px] bg-[#7877C6] px-5 py-2 text-sm font-medium text-white hover:bg-[#7877C6]/90 transition cursor-pointer">
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
