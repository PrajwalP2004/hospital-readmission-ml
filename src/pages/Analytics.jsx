import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Users, Pill, Clock } from 'lucide-react';
import { Card, cn } from '../components/common/UIPrimitives';
import LoadingSpinner from '../components/common/LoadingSpinner';
import apiClient from '../api/apiClient';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/analytics/summary')
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage label="Loading analytics …" />;

  const total = analytics?.total_patients || 0;
  const highPct = analytics?.high_risk_pct || 0;
  const avgRisk = analytics?.avg_risk_probability || 0;
  const avgStay = analytics?.avg_hospital_stay || 0;
  const avgMeds = analytics?.avg_medications || 0;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Population Analytics</h2>
          <p className="text-slate-500 font-medium mt-1">Deep-dive insights into readmission trends across the facility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AnalyticsCard 
          icon={<TrendingUp className="text-emerald-500" />}
          title="Model Recall"
          value="88.3%"
          subtitle="Sensitivity to high-risk cases"
          description="Optimized to maximize detection of at-risk patients, reducing missed clinical signals."
        />
        <AnalyticsCard 
          icon={<PieChart className="text-blue-500" />}
          title="Patients Assessed"
          value={total.toLocaleString()}
          subtitle="Records in database"
          description={`${analytics?.high_risk_count || 0} high risk, ${analytics?.medium_risk_count || 0} medium, ${analytics?.low_risk_count || 0} low risk.`}
        />
        <AnalyticsCard 
          icon={<Activity className="text-purple-500" />}
          title="Decision Threshold"
          value="0.417"
          subtitle="Optimized boundary"
          description="Dynamically tuned to balance clinical intervention costs vs. readmission probability."
        />
      </div>

      {/* Risk Distribution */}
      <Card title="Risk Distribution" subtitle="Breakdown of readmission risk across the patient population">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <RiskBar label="High Risk" count={analytics?.high_risk_count || 0} total={total} color="red" />
          <RiskBar label="Medium Risk" count={analytics?.medium_risk_count || 0} total={total} color="amber" />
          <RiskBar label="Low Risk" count={analytics?.low_risk_count || 0} total={total} color="emerald" />
        </div>
      </Card>

      {/* Clinical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard icon={<BarChart3 className="text-blue-500" />} label="Avg. Risk Probability" value={`${avgRisk.toFixed(1)}%`} subtitle="Across all assessed patients" />
        <MetricCard icon={<Clock className="text-amber-500" />} label="Avg. Hospital Stay" value={`${avgStay.toFixed(1)} days`} subtitle="Mean length of stay" />
        <MetricCard icon={<Pill className="text-purple-500" />} label="Avg. Medications" value={avgMeds.toFixed(1)} subtitle="Per patient encounter" />
      </div>
    </div>
  );
};

const AnalyticsCard = ({ icon, title, value, subtitle, description }) => (
  <Card className="hover:shadow-lg transition-all duration-300">
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{icon}</div>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="mb-4">
      <h2 className="text-4xl font-black text-slate-800">{value}</h2>
      <p className="text-xs font-bold text-slate-500 mt-1">{subtitle}</p>
    </div>
    <p className="text-xs text-slate-400 leading-relaxed font-medium pt-4 border-t border-slate-50 uppercase tracking-wider">
      {description}
    </p>
  </Card>
);

const RiskBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = {
    red: { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
  };
  const c = colors[color];

  return (
    <div className={`p-6 rounded-2xl ${c.light} border border-slate-100`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-black uppercase tracking-widest ${c.text}`}>{label}</span>
        <span className="text-2xl font-black text-slate-800">{count}</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${c.bg} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{pct}% of population</p>
    </div>
  );
};

const MetricCard = ({ icon, label, value, subtitle }) => (
  <Card>
    <div className="flex items-center space-x-3 mb-3">
      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">{icon}</div>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{subtitle}</p>
  </Card>
);

export default Analytics;
