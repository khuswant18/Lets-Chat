"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner = ({
  size = 24,
  className = "",
  text,
}: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin text-indigo-600" />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
