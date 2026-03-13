import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullPage = false, label = "Loading dashboard …" }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 rounded-full opacity-20" />
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
