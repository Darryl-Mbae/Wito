import React from "react";
import {
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  House,
  Users,
  PlusCircle,
  Gem,
  type LucideIcon,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import appConfig from "../config/app";
import { useLogout } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import type { Organization } from "./Header";

interface SidebarProps {
  isOpen: boolean;
  activeOrg?: Organization | null;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

interface NavItem {
  name: string;
  icon: LucideIcon;
  badge?: number;
  premium?: boolean;
  premiumDescription?: string;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

const SideBar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  activeOrg,
  setIsCollapsed,
}) => {
  const { logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationConfig: NavCategory[] = [
    {
      category: "Overview",
      items: [
        {
          name: "Analytics",
          icon: House,
          premium: activeOrg?.plan === "free",
          premiumDescription: "View detailed insights on event performance, attendance trends, and revenue over time.",
        },
        { name: "Calendar", icon: Calendar },
        { name: "Events", icon: PlusCircle },
        { name: "Directors", icon: Users },
      ],
    },
    {
      category: "Preferences",
      items: [
        { name: "Settings", icon: Settings },
        { name: "Help & Support", icon: HelpCircle },
        { name: "Logout", icon: LogOut },
      ],
    },
  ];

  const routeMap: Record<string, string> = {
    Analytics: "/dashboard",
    Calendar: "/dashboard/calendar",          // index route is now CalendarPage
    Events: "/dashboard/events",
    Directors: "/dashboard/directors",
    Settings: "/dashboard/settings",
    "Help & Support": "/dashboard/help",
  };

  const handleNavClick = async (name: string) => {
    if (name === "Logout") {
      await logout();
      navigate("/auth");
      return;
    }
    const route = routeMap[name];
    if (route) navigate(route);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 flex flex-col
          border-r border-gray-100 bg-white px-4 py-6
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-84 lg:w-74"}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center mb-6 ${isCollapsed ? "justify-center" : "justify-between px-2"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-5 flex items-center shrink-0">
              <img
                src={appConfig.logoUrl}
                alt={appConfig.name}
                className="h-full w-auto object-contain"
              />
            </div>

            {!isCollapsed && (
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                {appConfig.name}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 lg:hidden">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 h-6 w-6 items-center justify-center rounded-full border border-gray-100 bg-white shadow-xs text-gray-400 hover:text-gray-600 z-50 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {navigationConfig.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                {!isCollapsed && (
                  <h3 className="px-3 text-[11px] font-normal text-gray-300 uppercase tracking-wider">
                    {cat.category}
                  </h3>
                )}

                <nav className="space-y-1">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = routeMap[item.name] === location.pathname;

                    return (
                      <div key={item.name} className="relative group">
                        <button
                          onClick={() => handleNavClick(item.name)}
                          {...(isCollapsed ? {
                            "data-tooltip-id": "sidebar-tooltip",
                            "data-tooltip-content": item.name,
                          } : {})}
                          className={`
                            w-full flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer
                            ${isCollapsed ? "justify-center px-0" : "justify-between px-3"}
                            ${isActive
                              ? "bg-[#7877C6]/8 text-[#7877C6]"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} className={isActive ? "text-[#7877C6]" : "text-gray-400"} />
                            {!isCollapsed && (
                              <span className="flex items-center gap-1.5">
                                {item.name}
                                {item.premium && <Gem size={11} className="text-[#7877C6]" />}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Premium tooltip */}
                        {!isCollapsed && item.premium && (
                          <div className="z-40 absolute top-full left-3 mt-1.5 w-56 hidden group-hover:block pointer-events-none">
                            <div className="bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 leading-relaxed shadow-lg relative">
                              <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
                              <p className="font-medium mb-0.5 flex items-center gap-1">
                                <Gem size={10} className="text-[#7877C6]" /> Premium feature
                              </p>
                              <p className="text-gray-400">{item.premiumDescription}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {!isCollapsed && activeOrg?.plan === "free" && (
            <div className="relative mt-8 overflow-hidden rounded-2xl bg-linear-to-br from-[#7877C6] to-[#5b5aa0] p-4 text-white">
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Sparkles size={16} />
                </div>
                <h4 className="text-sm font-semibold">Upgrade to Premium!</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Upgrade your account and unlock all premium platform utilities.
                </p>
                <button className="mt-2 w-full rounded-xl bg-white py-2 text-center text-xs font-semibold text-[#7877C6] hover:bg-white/90 cursor-pointer">
                  Upgrade premium
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <Tooltip
        id="sidebar-tooltip"
        place="right"
        style={{
          zIndex: 100,
          backgroundColor: "#1f2937",
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "6px",
        }}
      />
    </>
  );
};

export default SideBar;