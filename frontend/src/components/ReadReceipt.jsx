import React from "react";

const ReadReceipt = ({ readStatus, isOwnMessage }) => {
  if (!isOwnMessage) return null;

  const Tick = ({ className }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  if (readStatus === "read") {
    return (
      <div className="flex items-center">
        <Tick className="h-3 w-3 text-blue-400" />
        <Tick className="-ml-0.5 h-3 w-3 text-blue-400" />
      </div>
    );
  }
  if (readStatus === "delivered") {
    return (
      <div className="flex items-center">
        <Tick className="h-3 w-3 text-white/50" />
        <Tick className="-ml-0.5 h-3 w-3 text-white/50" />
      </div>
    );
  }
  if (readStatus === "sent") {
    return (
      <div className="flex items-center">
        <Tick className="h-3 w-3 text-white/50" />
      </div>
    );
  }
  return null;
};

export default ReadReceipt;
