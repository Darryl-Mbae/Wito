import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Building2,
  ChevronDown,
  Search,
  Plus,
  Check,
  LogOut,
  Settings,
  Coins,
  Store,
} from "lucide-react";
import {
  getAuth,
  onAuthStateChanged,
  type User as AuthUser,
} from "firebase/auth";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import app from "../config/firebase";
import { BuyCreditsModal } from "../pages/dashboard/BuyCredits";

export interface Organization {
  id: string;
  name: string;
  color: string;
  role?: string;
  plan?: string;
  createdBy: string;
}

interface HeaderProps {
  user: AuthUser | null;
  refreshKey: number;
  setSidebarOpen: (v: boolean) => void;
  activeOrg: Organization | null;
  setActiveOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
  isCollapsed: boolean;
}

export function Header({
  setSidebarOpen,
  activeOrg,
  user,
  refreshKey,
  setActiveOrg,
  isCollapsed,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userPopoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isNotificationsPage = location.pathname === "/dashboard/notifications";

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  // Format createdAt from Firebase user metadata
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close org dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setUserPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  // Close user popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!userPopoverRef.current?.contains(e.target as Node)) {
        setUserPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time credits listener for the current user
  // Real-time credits listener for the current user
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
      if (!currentUser) {
        setCredits(null);
        return;
      }
      unsubSnapshot = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (snap.exists()) {
          setCredits(snap.data().credits ?? 0);
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOrgs([]);
        setActiveOrg(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const userOrgs = userData.organization || [];

        const colors = [
          "bg-[#7877C6]",
          "bg-[#1D9E75]",
          "bg-[#D85A30]",
          "bg-[#EAB308]",
          "bg-[#3B82F6]",
        ];

        const fetchedOrgs: Organization[] = [];

        for (let i = 0; i < userOrgs.length; i++) {
          const orgRef = userOrgs[i];
          if (!orgRef.id) continue;
          const orgDoc = await getDoc(doc(db, "organizations", orgRef.id));
          if (!orgDoc.exists()) continue;
          fetchedOrgs.push({
            id: orgRef.id,
            name: orgDoc.data().name || "Unnamed Club",
            color: colors[i % colors.length],
            role: orgRef.role,
            plan: orgDoc.data().plan || "free",
            createdBy: orgDoc.data().createdBy || "",
          });
        }

        setOrgs(fetchedOrgs);

        setActiveOrg((current) => {
          if (!current) return fetchedOrgs[0] ?? null;
          const stillExists = fetchedOrgs.find((o) => o.id === current.id);
          if (!stillExists) return fetchedOrgs[0] ?? null;
          const lastOrg = fetchedOrgs[fetchedOrgs.length - 1];
          if (refreshKey > 0 && lastOrg.id !== current.id) return lastOrg;
          return current;
        });
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setActiveOrg, refreshKey]);

  useEffect(() => {
    if (loading) return;
    if (refreshKey > 0) return;
    if (orgs.length === 0 && location.pathname !== "/dashboard/create-club") {
      navigate("/dashboard/create-club");
    }
  }, [loading, orgs, refreshKey, location.pathname, navigate]);

  const initials = user?.displayName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();



  return (
    <header
      className={`fixed top-0 right-0 z-40 flex h-20 items-center justify-between border-b border-gray-100 bg-white px-4 md:px-8 shrink-0 transition-all duration-300 ease-in-out left-0 ${isCollapsed ? "lg:left-20" : "lg:left-74"
        }`}
    >
      {/* Left: hamburger + org switcher */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 lg:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpen((v) => !v);
              setQuery("");
            }}
            disabled={loading || !activeOrg}
            className="flex items-center gap-2 rounded-xl border border-gray-100 px-2.5 py-1.5 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            <div
              className={`flex h-[26px] w-[26px] items-center justify-center rounded-md ${activeOrg ? activeOrg.color : "bg-gray-200"
                }`}
            >
              <Building2 size={13} className="text-white" />
            </div>
            <span className="text-[13.5px] font-medium text-gray-800">
              {loading ? "Loading..." : activeOrg?.name || "No Organization"}
            </span>
            <ChevronDown
              size={13}
              className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""
                }`}
            />
          </button>

          {open && (
            <div className="absolute left-0 top-[calc(100%+6px)] w-[260px] rounded-xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 z-50 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-2.5">
                <Search size={14} className="text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find organization..."
                  className="w-full bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>

              <div className="py-1.5 max-h-[200px] overflow-y-auto">
                {filtered.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrg(org);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-[22px] w-[22px] items-center justify-center rounded-[5px] text-[11px] font-semibold text-white ${org.color}`}
                      >
                        {org.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-[13px] text-gray-700 truncate">
                        {org.name}
                      </span>
                    </div>
                    {activeOrg?.id === org.id && (
                      <Check size={14} className="text-[#7877C6]" />
                    )}
                  </button>
                ))}

                {filtered.length === 0 && (
                  <div className="px-3.5 py-3 text-[13px] text-gray-400 text-center">
                    No organizations found
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />
              <div className="py-1.5">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/create-club");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Plus size={15} className="text-gray-400" />
                  <span className="text-[13px] text-gray-600">
                    New organization
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className={`rounded-xl p-2 transition cursor-pointer ${isNotificationsPage
              ? "bg-[rgba(120,119,198,0.08)] text-[#7877C6]"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
          >
            <Bell size={20} />
          </button>
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-[#7877C6]" />
        </div>

        <div className="h-6 w-px bg-gray-100" />

        {/* User avatar + popover */}
        <div className="relative" ref={userPopoverRef}>
          <button
            onClick={() => setUserPopoverOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-gray-50 transition cursor-pointer"
          >
            {/* {user?.photoURL && user?.photoURL !== "" ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : ( */}
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#7877C6]">
              <span className="text-white font-semibold text-sm">
                {initials}
              </span>
            </div>

          </button>

          {/* User details popover */}
          {userPopoverOpen && user && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] rounded-xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 z-50 overflow-hidden">
              {/* Profile header */}
              <div className="px-4 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : ( */}
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#7877C6] flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {initials}
                    </span>
                  </div>
                  {/* )} */}
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-gray-800 truncate">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-[11.5px] text-[#7877C6] font-medium truncate">
                      {activeOrg?.role
                        ? activeOrg.role.charAt(0).toUpperCase() +
                        activeOrg.role.slice(1)
                        : "Member"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-4 py-2.5 border-b border-gray-100 space-y-1.5">
                <span className="block text-[12px] text-gray-500 truncate">
                  {user.email || "—"}
                </span>
                {createdAt && (
                  <span className="block text-[12px] text-gray-500">
                    Joined {createdAt}
                  </span>
                )}
                {/* Credits balance */}
                {credits !== null && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Coins size={13} className="text-amber-400" />
                      <span className="text-[12px] font-semibold text-gray-700 tabular-nums">
                        {credits.toLocaleString()} credits
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUserPopoverOpen(false);
                        setShowBuyCredits(true);
                      }}
                      className="text-[11px] font-medium text-[#7877C6] hover:underline cursor-pointer"
                    >
                      Buy
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="py-1.5">
                <button
                  onClick={() => {
                    setUserPopoverOpen(false);
                    navigate("/dashboard/transactions");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Coins size={13} className="text-gray-400" />
                  <span className="text-[13px] text-gray-600">Transaction history</span>
                </button>
                <button
                  onClick={() => {
                    setUserPopoverOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Settings size={13} className="text-gray-400" />
                  <span className="text-[13px] text-gray-600">Account settings</span>
                </button>
               
                <button
                  onClick={() => {
                    setUserPopoverOpen(false);
                    getAuth(app).signOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-red-50 transition cursor-pointer group"
                >
                  <LogOut size={13} className="text-gray-400 group-hover:text-red-400 transition" />
                  <span className="text-[13px] text-gray-600 group-hover:text-red-500 transition">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyCredits && (
        <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />
      )}
    </header>
  );
}