import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Gem, X } from "lucide-react";
import { useActiveOrg } from "../contexts/ActiveOrgContext";

export const PremiumModal: React.FC<{ description: string; onClose: () => void }> = ({ description, onClose }) => {
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" 
      onClickCapture={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClickCapture={e => e.stopPropagation()}>
        <div className="p-6 flex flex-col items-center text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-50 transition cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="h-14 w-14 rounded-2xl bg-[#7877C6]/10 flex items-center justify-center mb-5 rotate-3">
            <Gem size={26} className="text-[#7877C6]" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">Premium Feature</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {description}
          </p>
          
          <button 
            onClick={onClose}
            className="w-full bg-[#7877C6] text-white font-medium py-3 rounded-xl hover:bg-[#6b6ab3] transition cursor-pointer shadow-md shadow-[#7877C6]/20"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface PremiumFeatureProps {
  isPremium: boolean;
  description: string;
  children: React.ReactNode;
  className?: string;
  tooltipPosition?: "bottom" | "right" | "top" | "bottom-left"; 
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  isPremium,
  description,
  children,
  className = "",
  tooltipPosition = "bottom",
}) => {
  const { activeOrg } = useActiveOrg();
  const [showModal, setShowModal] = useState(false);

  const isFree = !activeOrg || activeOrg.plan === "free";
  const isLocked = isPremium && isFree;

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  // Positioning logic for the tooltip
  let tooltipClasses = "";
  let arrowClasses = "";
  if (tooltipPosition === "bottom") {
      tooltipClasses = "top-full left-1/2 -translate-x-1/2 mt-2";
      arrowClasses = "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900";
  } else if (tooltipPosition === "right") {
      tooltipClasses = "left-full top-1/2 -translate-y-1/2 ml-2";
      arrowClasses = "right-full top-1/2 -translate-y-1/2 border-r-gray-900";
  } else if (tooltipPosition === "top") {
      tooltipClasses = "bottom-full left-1/2 -translate-x-1/2 mb-2";
      arrowClasses = "top-full left-1/2 -translate-x-1/2 border-t-gray-900";
  } else if (tooltipPosition === "bottom-left") {
      tooltipClasses = "top-full left-3 mt-1.5";
      arrowClasses = "bottom-full left-4 border-b-gray-900";
  }

  return (
    <>
      <div 
        className={`relative group ${className}`} 
        onClickCapture={handleClickCapture}
      >
        {children}
        
        {/* Hover Tooltip for Desktop */}
        <div className={`z-50 absolute ${tooltipClasses} w-56 hidden lg:group-hover:block pointer-events-none`}>
          <div className="bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 leading-relaxed shadow-lg relative">
            <div className={`absolute border-4 border-transparent ${arrowClasses}`} />
            <p className="font-medium mb-0.5 flex items-center gap-1">
              <Gem size={10} className="text-[#7877C6]" /> Premium feature
            </p>
            <p className="text-gray-400">{description}</p>
          </div>
        </div>
      </div>

      {/* Modal for Click */}
      {showModal && <PremiumModal description={description} onClose={() => setShowModal(false)} />}
    </>
  );
};
