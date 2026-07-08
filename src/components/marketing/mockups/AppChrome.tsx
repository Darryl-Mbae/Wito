import type { ReactNode } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Palette,
  CheckSquare,
  Users,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: false },
  { label: "Events", icon: PlusCircle, active: false },
  { label: "Design", icon: Palette, active: false },
  { label: "Tasks", icon: CheckSquare, active: false, badge: 2 },
  { label: "Directors", icon: Users, active: false },
];

type Props = {
  activeNav?: string;
  children: ReactNode;
  className?: string;
  mobilePreview?: ReactNode;
};

export default function AppChrome({ activeNav = "Dashboard", children, className = "", mobilePreview }: Props) {
  return (
    <div className={`relative flex rounded-2xl overflow-hidden border border-gray-200/80 bg-[#f8fafc] shadow-2xl shadow-[#7877C6]/10 ${className}`}>
      <aside className="hidden sm:flex w-44 shrink-0 flex-col border-r border-gray-100 bg-white px-3 py-4">
        <div className="flex items-center gap-2 px-2 mb-5">
          <img src="/images/logo.png" alt="Rada" className="h-4 w-auto" />
          <span className="text-sm font-bold text-gray-900">Rada</span>
        </div>
        <p className="px-3 text-[9px] uppercase tracking-widest text-gray-300 mb-2">Overview</p>
        <nav className="space-y-0.5">
          {NAV.map(({ label, icon: Icon, badge }) => {
            const active = label === activeNav;
            return (
              <div
                key={label}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-medium ${
                  active ? "bg-[#7877C6]/8 text-[#7877C6]" : "text-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={13} className={active ? "text-[#7877C6]" : "text-gray-400"} />
                  {label}
                </div>
                {badge && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7877C6] text-[9px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 bg-white">{children}</div>
      {mobilePreview && (
        <div className="hidden lg:block absolute -right-5 -bottom-5">
          <div className="rounded-[2rem] border-8 border-gray-900 bg-gray-900 shadow-2xl w-[180px] overflow-hidden">
            <div className="h-5 bg-gray-900 flex items-center justify-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-700" />
            </div>
            <div className="bg-white">{mobilePreview}</div>
          </div>
        </div>
      )}
    </div>
  );
}
