import React from "react";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && (
        <Icon size={36} className="text-gray-200 mb-4" />
      )}
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mb-4 max-w-xs text-center">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs text-[#7877C6] font-medium hover:underline transition cursor-pointer mt-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
