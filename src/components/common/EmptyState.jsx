import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = ({ title, message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
    <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
      {Icon ? <Icon className="w-10 h-10 text-slate-300" /> : <Search className="w-10 h-10 text-slate-300" />}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title || "No data found"}</h3>
    <p className="max-w-xs text-sm text-slate-400 font-medium leading-relaxed uppercase tracking-widest italic">
      {message || "Try adjusting your filters or search terms."}
    </p>
  </div>
);

export default EmptyState;
