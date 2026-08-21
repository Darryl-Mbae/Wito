import React from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, ExternalLink } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  waitlistUrl?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  waitlistUrl = "https://forms.gle/f2Tdo7Bh64i3Ar6LA"
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 flex flex-col items-center text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-50 transition cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-[#7877C6] to-[#5b5aa0] flex items-center justify-center mb-6">
            <Sparkles size={28} className="text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon!</h3>
          <p className="text-sm text-gray-600 mb-2">Premium features are on the way</p>
          
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-700 leading-relaxed">
              We're building exciting premium features to help your organization scale. Join our waitlist to be notified when they launch.
            </p>
          </div>
          
          <a
            href={waitlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#7877C6] text-white font-medium py-3 rounded-xl hover:bg-[#6b6ab3] transition cursor-pointer shadow-md shadow-[#7877C6]/20 flex items-center justify-center gap-2"
          >
            Join Waitlist
            <ExternalLink size={16} />
          </a>

          <button
            onClick={onClose}
            className="w-full mt-3 bg-gray-100 text-gray-700 font-medium py-2 rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
