import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Pill, Calendar, LogOut, ShieldCheck, TrendingDown, ClipboardList, Brain, X } from 'lucide-react';
import { Card, Button, cn } from '../components/common/UIPrimitives';
import authService from '../services/authService';
import ClinicalIntakeForm from '../components/predictions/ClinicalIntakeForm';
import predictionService from '../services/predictionService';
import useApi from '../hooks/useApi';

const PatientPortal = () => {
  const [user, setUser] = useState(null);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const navigate = useNavigate();

  const { loading: predictLoading, request: runPrediction } = useApi(predictionService.predict);
  const { data: schema } = useApi(predictionService.getSchema);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'patient') {
      navigate('/login');
    } else {
      setUser(currentUser);
      // Fetch schema on mount
      predictionService.getSchema();
    }
  }, [navigate]);

  const handlePredict = async (data) => {
    try {
      const result = await runPrediction(data);
      setPrediction(result);
      
      // Persist clinical data every time a prediction is made
      await authService.updateUserRecord(user.mrn, {
        risk_level: result.risk_level,
        risk_probability: result.risk_percentage,
        num_medications: data.num_medications,
        num_lab_procedures: data.num_lab_procedures,
        time_in_hospital: data.time_in_hospital,
        diag_1: data.diag_1,
        diag_2: data.diag_2,
        diag_3: data.diag_3,
        medical_specialty: data.medical_specialty,
        diabetesMed: data.diabetesMed
      });
      
      // Refresh local user state
      setUser(authService.getCurrentUser());
    } catch (err) {
      // Handled by hook
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Portal Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">MedPredict <span className="text-blue-600">Portal</span></span>
        </div>
        <div className="flex items-center space-x-6">
          <Button 
            className="flex items-center space-x-2 h-10 px-4"
            onClick={() => setIsPredictModalOpen(true)}
          >
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Assess Risk</span>
          </Button>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patient ID: {user.mrn}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all group"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 animate-fade-in">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-slate-500 font-medium mt-2">Your personalized clinical summary and readmission risk assessment.</p>
        </div>

        {/* Risk Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 border-none text-white p-10 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-blue-500/10 skew-x-12" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-6">Current Risk Assessment</h3>
                  <div className="flex items-end space-x-6">
                    <div className="text-7xl font-black tracking-tighter">{user.risk_probability}%</div>
                    <div className="mb-3">
                      <div className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 bg-white/10",
                        user.riskLevel === 'High' ? "text-red-400 border-red-400/30" : "text-emerald-400 border-emerald-400/30"
                      )}>
                        {user.riskLevel} Readmission Risk
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 grid grid-cols-3 gap-8">
                  <PortalStat label="Last Admission" value={user.admitted} icon={<Calendar className="w-4 h-4" />} />
                  <PortalStat label="Care Provider" value={user.medical_specialty || 'General Practice'} icon={<User className="w-4 h-4" />} />
                  <PortalStat label="Hosp. Stay" value={`${user.time_in_hospital} Days`} icon={<Activity className="w-4 h-4" />} />
                </div>
              </div>
           </Card>

           <div className="space-y-6">
             <Card title="Quick Metrics" className="h-full">
                <div className="space-y-6">
                  <MetricRow icon={<Pill className="text-blue-500" />} label="Medications" value={user.num_medications} sub="Currently Active" />
                  <MetricRow icon={<ClipboardList className="text-amber-500" />} label="Lab Procedures" value={user.num_lab_procedures} sub="Completed" />
                  <MetricRow icon={<TrendingDown className="text-emerald-500" />} label="Health Trend" value="Stable" sub="Good progress" />
                </div>
             </Card>
           </div>
        </div>

        {/* Diagnosis & Care Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card title="Clinical Profile" subtitle="Standardized ICD coding categories">
              <div className="space-y-4">
                <DiagnosisItem label="Primary Diagnosis" code={user.diag_1} />
                <DiagnosisItem label="Secondary Diagnosis" code={user.diag_2} />
                <DiagnosisItem label="Tertiary Diagnosis" code={user.diag_3} />
              </div>
           </Card>
           
           <Card title="Personal Health Record" subtitle="Electronic Health Record Summary">
              <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diabetes Status</p>
                    <p className="text-sm font-bold text-slate-800">{user.diabetesMed === 'Yes' ? 'Under Medication' : 'Non-Medicinal'}</p>
                 </div>
                 <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Care Coordination</p>
                    <p className="text-sm font-medium text-slate-600">Your care team is monitoring your {user.medical_specialty} stats.</p>
                 </div>
              </div>
           </Card>
        </div>
      </main>

      {/* Prediction Modal */}
      {isPredictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !predictLoading && setIsPredictModalOpen(false)} />
          <Card className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in p-0 border-none shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-black text-slate-800">Personal Health Predictor</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Execute high-fidelity readmission modeling</p>
              </div>
              <button 
                disabled={predictLoading}
                onClick={() => setIsPredictModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {!prediction ? (
                <ClinicalIntakeForm 
                  onSubmit={handlePredict} 
                  isLoading={predictLoading}
                  initialData={user}
                />
              ) : (
                <div className="animate-fade-in space-y-8">
                  <div className={cn(
                    "p-8 rounded-3xl border-l-8 shadow-xl",
                    prediction.risk_level === 'High' ? "border-l-red-500 bg-red-50/30" : 
                    prediction.risk_level === 'Medium' ? "border-l-amber-500 bg-amber-50/30" : "border-l-emerald-500 bg-emerald-50/30"
                  )}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-3xl font-black text-slate-800">Your Result: {prediction.risk_level} Risk</h4>
                        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Readmission Probability: {prediction.risk_percentage}%</p>
                      </div>
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
                        prediction.risk_level === 'High' ? "bg-red-500" : 
                        prediction.risk_level === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        <Brain className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          prediction.risk_level === 'High' ? "bg-red-500" : 
                          prediction.risk_level === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${prediction.risk_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Intervention Summary</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Based on your clinical vector, the MedPredict model identifies you as a <span className="font-bold text-slate-800">{prediction.risk_level.toLowerCase()} priority</span> for readmission intervention. 
                      {prediction.risk_level === 'High' ? " We recommend scheduling a follow-up with your care team within 48 hours." : " Continue following your current discharge plan and medication schedule."}
                    </p>
                  </div>

                  <Button className="w-full h-12" onClick={() => setPrediction(null)}>Run New Assessment</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const PortalStat = ({ label, value, icon }) => (
  <div>
    <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest flex items-center space-x-2">
      {icon}
      <span>{label}</span>
    </p>
    <p className="text-lg font-bold mt-1">{value}</p>
  </div>
);

const MetricRow = ({ icon, label, value, sub }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-lg bg-slate-50">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
      </div>
    </div>
    <span className="text-xl font-black text-slate-800">{value}</span>
  </div>
);

const DiagnosisItem = ({ label, code }) => (
  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
     <span className="text-sm font-bold text-slate-600">{label}</span>
     <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
        CODE: {code}
     </span>
  </div>
);

export default PatientPortal;
