import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser() || { name: 'Clinician' };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search patients, MRN, or records …"
          className="w-full bg-slate-50 border border-slate-100 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all font-medium"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center space-x-4 pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {user.role === 'clinician' ? 'Senior Clinician' : 'Patient View'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all overflow-hidden border border-slate-200">
             {user.role === 'clinician' ? <User className="w-5 h-5" /> : <div className="font-bold text-blue-600">{user.name[0]}</div>}
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
