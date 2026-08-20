import React, { useState } from "react";

interface UnderConstructionBannerProps {
  message?: string;
  dismissible?: boolean;
  className?: string;
}

/**
 * A slim banner to place above your nav bar, letting visitors know
 * the site (or part of it) is still under construction.
 *
 * Usage:
 *   <UnderConstructionBanner />
 *   <Navbar />
 *
 *   <UnderConstructionBanner message="New site coming soon!" dismissible={false} />
 */
const UnderConstructionBanner: React.FC<UnderConstructionBannerProps> = ({
  message = "This site is under construction. Some features may not work as expected.",
  dismissible = true,
  className = "",
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`mt-18 flex w-full items-center justify-center gap-3 bg-yellow-400 px-4 py-2 text-sm font-medium text-yellow-950 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 flex-shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
          clipRule="evenodd"
        />
      </svg>

      <span className="text-center">{message}</span>

      {dismissible && (
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="ml-2 flex-shrink-0 rounded p-0.5 hover:bg-yellow-500/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UnderConstructionBanner;
