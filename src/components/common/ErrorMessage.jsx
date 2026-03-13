import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-red-50 border border-red-100">
      <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-100/50">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">Request Failed</h3>
      <p className="max-w-md text-sm text-red-600 mb-6 leading-relaxed">
        {message || "We encountered an error while fetching the data. Please ensure the backend server is running."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
