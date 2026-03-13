import React, { useState, useEffect } from 'react';
import { Activity, Brain, ShieldAlert, CheckCircle2, AlertCircle, Search, ArrowRight, Table as TableIcon } from 'lucide-react';
import { Card, Button, Input, Select, cn } from '../components/common/UIPrimitives';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import useApi from '../hooks/useApi';
import predictionService from '../services/predictionService';
import patientService from '../services/patientService';

import ClinicalIntakeForm from '../components/predictions/ClinicalIntakeForm';

const PredictionRunner = () => {
  const [activeTab, setActiveTab] = useState('assessment');
  const [searchMrn, setSearchMrn] = useState('');
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);

  const { data: schema, loading: schemaLoading, error: schemaError, request: fetchSchema } = useApi(predictionService.getSchema);
  const { loading: predictLoading, request: runPrediction } = useApi(predictionService.predict);
  const { request: fetchPatients } = useApi(patientService.getAll);

  useEffect(() => {
    fetchSchema();
    if (schema?.defaults) setFormData(schema.defaults);
  }, [fetchSchema, schema?.defaults]);

  const handleMrnLookup = async () => {
    if (!searchMrn.trim()) return;
    const patients = await fetchPatients();
    const patient = patients.find(p => p.mrn.toLowerCase() === searchMrn.toLowerCase());
    if (patient) {
      setFormData(patient);
      setActiveTab('assessment');
    } else {
      alert("No patient found with this MRN.");
    }
  };

  const handlePredict = async (data) => {
    try {
      const result = await runPrediction(data);
      setPrediction(result);
    } catch (err) {
      // Handled by hook
    }
  };

  if (schemaLoading) return <LoadingSpinner fullPage label="Syncing with Clinical Schema …" />;
  if (schemaError) return <ErrorMessage message={schemaError} onRetry={fetchSchema} />;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">AI Diagnostic Suite</h2>
          <p className="text-slate-500 font-medium mt-1">Execute high-fidelity clinical risk modeling.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Pipeline: MedPredict-v2-Full</span>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-slate-100 pb-px">
        <button onClick={() => setActiveTab('search')} className={cn("pb-4 text-sm font-bold border-b-2 transition-all px-2", activeTab === 'search' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>Patient Lookup</button>
        <button onClick={() => setActiveTab('assessment')} className={cn("pb-4 text-sm font-bold border-b-2 transition-all px-2", activeTab === 'assessment' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>Clinical Assessment</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="space-y-6">
          {activeTab === 'search' && (
             <Card title="Database Lookup" subtitle="Pre-fill assessment from existing medical record">
                <div className="flex space-x-3">
                  <Input placeholder="Enter MRN (e.g. MRN-004821)" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} />
                  <Button onClick={handleMrnLookup} className="min-w-[120px]"><Search className="w-4 h-4 mr-2" /> Search</Button>
                </div>
             </Card>
          )}

          <Card title="Clinical Parameters" subtitle="Complete all required features for high-fidelity modeling">
            <ClinicalIntakeForm 
              onSubmit={handlePredict} 
              isLoading={predictLoading}
              initialData={formData}
            />
          </Card>
        </div>

        <div className="space-y-6">
           {!prediction ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                <TableIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Awaiting Diagnostic Vector</h3>
              <p className="max-w-xs text-sm text-slate-400 font-medium leading-relaxed italic uppercase tracking-widest">
                Input clinical features to calculate population-weighted readmission probability.
              </p>
            </div>
          ) : (
             <div className="animate-fade-in stagger-1 space-y-6">
              <Card className={cn(
                "border-l-8 transition-all duration-500",
                prediction.risk_level === 'High' ? "border-l-red-500 bg-red-50/10" : 
                prediction.risk_level === 'Medium' ? "border-l-amber-500 bg-amber-50/10" : "border-l-emerald-500 bg-emerald-50/10"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Inference: {prediction.risk_level} Risk</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Probability Score: <span className="text-slate-900 font-black">{prediction.risk_percentage}%</span>
                    </p>
                  </div>
                  <RiskIcon level={prediction.risk_level} />
                </div>

                <div className="relative h-4 bg-slate-100/50 rounded-full overflow-hidden mb-8 ring-1 ring-slate-100">
                   <div 
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full shadow-lg",
                      prediction.risk_level === 'High' ? "bg-red-500 shadow-red-500/30" : 
                      prediction.risk_level === 'Medium' ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                    )}
                    style={{ width: `${prediction.risk_percentage}%` }}
                   />
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Model Analysis</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {prediction.label}. Based on the threshold of <span className="font-bold text-slate-800">{prediction.threshold}</span>, 
                    this patient represents a <span className="font-bold">{prediction.risk_level.toLowerCase()}</span> priority for readmission prevention 
                    protocols within a 30-day window.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RiskIcon = ({ level }) => {
  if (level === 'High') return <ShieldAlert className="w-14 h-14 text-red-500 bg-red-50 rounded-2xl p-3" />;
  if (level === 'Medium') return <AlertCircle className="w-14 h-14 text-amber-500 bg-amber-50 rounded-2xl p-3" />;
  return <CheckCircle2 className="w-14 h-14 text-emerald-500 bg-emerald-50 rounded-2xl p-3" />;
};

export default PredictionRunner;
