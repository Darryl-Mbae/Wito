import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import { Header, type Organization } from "../components/Header";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import app from "../config/firebase";

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // refreshKey increments after a new club is created,
  // which tells Header to re-fetch orgs and auto-select the new one
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleOrgCreated = () => {
    setRefreshKey((k) => k + 1);
    navigate("/dashboard");
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-[#f8fafc] overflow-hidden antialiased text-gray-600">
      <SideBar
        isOpen={sidebarOpen}
        setIsCollapsed={setIsCollapsed}
        isCollapsed={isCollapsed}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col h-full overflow-hidden">

        <Header
          user={user}
          refreshKey={refreshKey}
          setSidebarOpen={setSidebarOpen}
          activeOrg={activeOrg}
          isCollapsed={isCollapsed}
          setActiveOrg={setActiveOrg}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white pt-25 lg:pt-25">
          <Outlet context={{ onOrgCreated: handleOrgCreated, activeOrg } satisfies DashboardContextType} />
        </main>

      </div>
    </div>
  );
};
export type DashboardContextType = {
  onOrgCreated: () => void;
  activeOrg: Organization | null;
};

export default Dashboard;
