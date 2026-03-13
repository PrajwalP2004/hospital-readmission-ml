import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, BarChart3, Pill } from 'lucide-react';
import { cn } from '../components/common/UIPrimitives';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users,           label: 'Patients', path: '/patients' },
  { icon: Activity,        label: 'Predictions', path: '/predictions' },
  { icon: BarChart3,       label: 'Analytics', path: '/analytics' },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Pill className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">MedPredict</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Readmission CDS</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm",
              isActive 
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Help Center</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Need assistance with clinical decision support?
          </p>
          <button className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
