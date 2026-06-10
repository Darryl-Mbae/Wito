import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { DashboardContextType } from "../Dashboard";
import { PremiumModal } from "../../components/PremiumFeature";

const DashboardHome: React.FC = () => {
  const { activeOrg } = useOutletContext<DashboardContextType>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (activeOrg && activeOrg.plan === "free") {
      setShowModal(true);
    }
  }, [activeOrg]);

  const handleClose = () => {
    setShowModal(false);
    navigate("/dashboard/calendar");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {showModal && (
        <PremiumModal
          description="View detailed insights on event performance, attendance trends, and revenue over time."
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default DashboardHome;
