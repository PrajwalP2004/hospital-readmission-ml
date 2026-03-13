import React, { useEffect, useState } from 'react';
import { Users, Activity, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, Button, cn } from '../components/common/UIPrimitives';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import useApi from '../hooks/useApi';
import patientService from '../services/patientService';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: patients, loading, error, request: fetchPatients } = useApi(patientService.getAll);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  
  useEffect(() => {
    apiClient.get('/analytics/summary')
      .then(data => setAnalytics(data))
      .catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPatients} />;

  const totalPatients = analytics?.total_patients || patients?.length || 0;
  const highRiskCount = analytics?.high_risk_count || patients?.filter(p => p.risk_level === 'High').length || 0;
  const avgRisk = analytics?.avg_risk_probability || 0;
  const lowRiskPct = totalPatients > 0 ? Math.round(((analytics?.low_risk_count || 0) / totalPatients) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Clinical Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time readmission risk metrics and patient status.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => { fetchPatients(); apiClient.get('/analytics/summary').then(setAnalytics); }}>Refresh Data</Button>
          <Button onClick={() => navigate('/predictions')}>New Prediction</Button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-500" />}
          label="Total Patients"
          value={totalPatients}
          trend={`${totalPatients} in database`}
          color="blue"
        />
        <StatCard 
          icon={<AlertTriangle className="text-red-500" />}
          label="High Risk Readmission"
          value={highRiskCount}
          trend={`${totalPatients ? Math.round((highRiskCount/totalPatients)*100) : 0}% of total`}
          color="red"
        />
        <StatCard 
          icon={<Activity className="text-amber-500" />}
          label="Avg. Risk Score"
          value={`${avgRisk.toFixed(1)}%`}
          trend={`Threshold: 41.7%`}
          color="amber"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-500" />}
          label="Low Risk Rate"
          value={`${lowRiskPct}%`}
          trend={`${analytics?.low_risk_count || 0} patients`}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Alerts */}
        <Card className="lg:col-span-2" title="Critical Readmission Alerts" subtitle="Patients requiring immediate discharge planning review">
          <div className="space-y-4">
            {patients?.filter(p => p.risk_level === 'High' || p.riskLevel === 'High').slice(0, 5).map((patient) => (
              <div key={patient.id || patient.mrn} className="flex items-center justify-between p-4 rounded-xl border border-red-50 bg-red-50/30 hover:bg-red-50/50 transition-all cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                    {patient.name?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{patient.name}</h4>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">High Risk Readmission</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600">{patient.mrn}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admitted: {patient.admitted}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
            {patients?.filter(p => p.risk_level === 'High' || p.riskLevel === 'High').length === 0 && (
              <p className="text-center text-slate-400 py-8 italic">No high-risk patients detected.</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card title="Quick Resources">
             <div className="space-y-3">
               <ResourceLink label="CDC Discharge Guidelines" url="#" />
               <ResourceLink label="Medication Reconciliation Protocol" url="#" />
               <ResourceLink label="Clinical AI Methodology" url="#" />
               <ResourceLink label="Staff Training Materials" url="#" />
             </div>
          </Card>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-200">
            <h3 className="font-bold text-lg">AI Assistant</h3>
            <p className="text-xs text-blue-100 mt-2 leading-relaxed opacity-90">
              Our clinical AI is ready to help you optimize discharge plans and reduce readmission rates.
            </p>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate('/predictions')}>
              Consult MedPredict
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color }) => {
  const colors = {
    blue: "bg-blue-50 border-blue-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
  };
  
  return (
    <Card className={cn("border-none", colors[color])}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{trend}</span>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </Card>
  );
};

const ResourceLink = ({ label, url }) => (
  <a href={url} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all group">
    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">{label}</span>
    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-400" />
  </a>
);

export default Dashboard;
