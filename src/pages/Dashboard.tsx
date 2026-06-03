import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../components/SideBar";
import { Header, type Organization } from "../components/Header";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden antialiased text-gray-600">
      <SideBar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          setSidebarOpen={setSidebarOpen}
          activeOrg={activeOrg}
          setActiveOrg={setActiveOrg}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          <Outlet context={{ activeOrg }} />
        </main>
      </div>
    </div>
  );
};
export type DashboardContextType = {
  activeOrg: Organization | null;
};

export default Dashboard;