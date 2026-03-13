import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, User, AlertCircle, Hash, Lock, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input, cn } from '../components/common/UIPrimitives';
import authService from '../services/authService';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        
        const user = await authService.register({
          name: formData.name,
          age: formData.age,
          password: formData.password
        });
        
        setSuccess(`Account created! Your MRN is ${user.mrn}. Redirecting...`);
        setTimeout(() => navigate('/portal'), 1500);
      } else {
        const user = await authService.login(formData.identifier, formData.password);
        
        if (user) {
          setSuccess('Access granted. Entering portal...');
          const target = user.role === 'clinician' ? '/' : '/portal';
          setTimeout(() => navigate(target), 1000);
        } else {
          setError('Invalid credentials. If you are a new patient, please create an account.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10] relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md px-6 relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-900/40 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MedPredict</h1>
          <p className="text-slate-400 font-medium mt-2">{isRegister ? 'Patient Registration' : 'Secure Clinical Access'}</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <Input name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} className="bg-slate-950/50 border-slate-800 text-white pl-10 h-11 focus:ring-blue-500/20" required />
                    <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Age</label>
                  <div className="relative">
                    <Input name="age" type="number" placeholder="30" value={formData.age} onChange={handleInputChange} className="bg-slate-950/50 border-slate-800 text-white pl-10 h-11 focus:ring-blue-500/20" required />
                    <Hash className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Name or MRN</label>
                <div className="relative">
                  <Input name="identifier" placeholder="e.g. John Doe or MRN-123" value={formData.identifier} onChange={handleInputChange} className="bg-slate-950/50 border-slate-800 text-white pl-10 h-11 focus:ring-blue-500/20" required />
                  <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="bg-slate-950/50 border-slate-800 text-white pl-10 h-11 focus:ring-blue-500/20" required />
                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <Input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} className="bg-slate-950/50 border-slate-800 text-white pl-10 h-11 focus:ring-blue-500/20" required />
                  <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
              <span>{loading ? 'Validating...' : isRegister ? 'Create Account' : 'Access Portal'}</span>
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
              className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
            >
              {isRegister ? 'Already have an account? Login' : 'New Patient? Create Profile'}
            </button>
          </div>
        </Card>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Clinician: 'Clinician Admin' / 'admin123'
        </p>
      </div>
    </div>
  );
};

export default Login;
