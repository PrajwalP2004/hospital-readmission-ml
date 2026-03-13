import React, { useState } from 'react';
import { X, UserPlus, Activity, ShieldCheck, Info, HeartPulse, ClipboardCheck, Pill, Stethoscope, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button, Input, Select, Card, cn } from './UIPrimitives';

const TABS = [
  { id: 'demo', label: 'Demographics', icon: Info },
  { id: 'hosp', label: 'Hospitalization', icon: Stethoscope },
  { id: 'activity', label: 'Activity', icon: HeartPulse },
  { id: 'meds', label: 'Medications', icon: Pill },
  { id: 'diag', label: 'Diagnoses', icon: ClipboardCheck },
];

const AddPatientModal = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState('demo');
  const [formData, setFormData] = useState({
    name: '', mrn: '', race: 'Caucasian', gender: 'Female', age: '[50-60)',
    time_in_hospital: 3, num_lab_procedures: 40, num_procedures: 0, num_medications: 10,
    number_outpatient: 0, number_emergency: 0, number_inpatient: 0, number_diagnoses: 5,
    payer_code: 'MC', medical_specialty: 'InternalMedicine',
    diag_1: '428', diag_2: '250', diag_3: '401',
    max_glu_serum: 'None', A1Cresult: 'None',
    metformin: 'No', repaglinide: 'No', nateglinide: 'No', chlorpropamide: 'No',
    glimepiride: 'No', glipizide: 'No', glyburide: 'No', tolbutamide: 'No',
    pioglitazone: 'No', rosiglitazone: 'No', acarbose: 'No', miglitol: 'No',
    troglitazone: 'No', tolazamide: 'No', insulin: 'No', 'glyburide-metformin': 'No',
    'glipizide-metformin': 'No', 'glimepiride-pioglitazone': 'No',
    change: 'No', diabetesMed: 'Yes', riskLevel: 'Low'
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextTab = () => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
  };

  const prevTab = () => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <Card className="flex-1 flex flex-col relative overflow-hidden shadow-2xl border-none p-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Clinical Intake Form</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comprehensive Health Assessment</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 border-r border-slate-50 bg-slate-50/50 p-4 space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
              {activeTab === 'demo' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Demographics</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <Input label="Patient Full Name" required value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
                    </div>
                    <Input label="MRN" required value={formData.mrn} onChange={e => handleInputChange('mrn', e.target.value)} />
                    <Select label="Race" value={formData.race} onChange={e => handleInputChange('race', e.target.value)} options={[{label:'Caucasian',value:'Caucasian'},{label:'AfricanAmerican',value:'AfricanAmerican'},{label:'Other',value:'Other'}]} />
                    <Select label="Gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} options={[{label:'Female',value:'Female'},{label:'Male',value:'Male'}]} />
                    <Select label="Age Range" value={formData.age} onChange={e => handleInputChange('age', e.target.value)} options={['[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)'].map(a => ({label:a, value:a}))} />
                  </div>
                </div>
              )}

              {activeTab === 'hosp' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Hospitalization Details</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="Days in Hospital" type="number" value={formData.time_in_hospital} onChange={e => handleInputChange('time_in_hospital', e.target.value)} />
                    <Select label="Medical Specialty" value={formData.medical_specialty} onChange={e => handleInputChange('medical_specialty', e.target.value)} options={['InternalMedicine', 'Emergency/Trauma', 'Family/GeneralPractice', 'Cardiology', 'Other'].map(s => ({label:s, value:s}))} />
                    <Select label="Payer Code" value={formData.payer_code} onChange={e => handleInputChange('payer_code', e.target.value)} options={['MC', 'HM', 'SP', 'BC', 'Other'].map(p => ({label:p, value:p}))} />
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">Clinical Activity Counts</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="Num Lab Procedures" type="number" value={formData.num_lab_procedures} onChange={e => handleInputChange('num_lab_procedures', e.target.value)} />
                    <Input label="Num Procedures" type="number" value={formData.num_procedures} onChange={e => handleInputChange('num_procedures', e.target.value)} />
                    <Input label="Num Medications" type="number" value={formData.num_medications} onChange={e => handleInputChange('num_medications', e.target.value)} />
                    <Input label="Outpatient Visits" type="number" value={formData.number_outpatient} onChange={e => handleInputChange('number_outpatient', e.target.value)} />
                    <Input label="Emergency Visits" type="number" value={formData.number_emergency} onChange={e => handleInputChange('number_emergency', e.target.value)} />
                    <Input label="Inpatient Visits (Prev Year)" type="number" value={formData.number_inpatient} onChange={e => handleInputChange('number_inpatient', e.target.value)} />
                    <Input label="Number of Diagnoses" type="number" value={formData.number_diagnoses} onChange={e => handleInputChange('number_diagnoses', e.target.value)} />
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-purple-500 pl-3">Medication Management</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Select label="Insulin Status" value={formData.insulin} onChange={e => handleInputChange('insulin', e.target.value)} options={['No', 'Steady', 'Up', 'Down'].map(v => ({label:v, value:v}))} />
                    <Select label="Diabetes Medication" value={formData.diabetesMed} onChange={e => handleInputChange('diabetesMed', e.target.value)} options={[{label:'Yes',value:'Yes'},{label:'No',value:'No'}]} />
                    <Select label="A1C Result" value={formData.A1Cresult} onChange={e => handleInputChange('A1Cresult', e.target.value)} options={['None', '>7', '>8', 'Norm'].map(v => ({label:v, value:v}))} />
                    <Select label="Max Glucose Serum" value={formData.max_glu_serum} onChange={e => handleInputChange('max_glu_serum', e.target.value)} options={['None', '>200', '>300', 'Norm'].map(v => ({label:v, value:v}))} />
                    <Select label="Metformin" value={formData.metformin} onChange={e => handleInputChange('metformin', e.target.value)} options={['No', 'Steady', 'Up', 'Down'].map(v => ({label:v, value:v}))} />
                    <Select label="Medication Change" value={formData.change} onChange={e => handleInputChange('change', e.target.value)} options={[{label:'No',value:'No'},{label:'Change',value:'Ch'}]} />
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-medium">Additional 15+ diabetes medications are defaulted to 'No' and can be managed in detailed patient view.</p>
                </div>
              )}

              {activeTab === 'diag' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Diagnosis Coding (ICD-10)</h4>
                  <div className="grid grid-cols-1 gap-6">
                    <Input label="Primary Diagnosis (diag_1)" value={formData.diag_1} onChange={e => handleInputChange('diag_1', e.target.value)} placeholder="e.g. 428" />
                    <Input label="Secondary Diagnosis (diag_2)" value={formData.diag_2} onChange={e => handleInputChange('diag_2', e.target.value)} placeholder="e.g. 250" />
                    <Input label="Tertiary Diagnosis (diag_3)" value={formData.diag_3} onChange={e => handleInputChange('diag_3', e.target.value)} placeholder="e.g. 401" />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase mb-2">Manual Risk Override (Optional)</h5>
                    <Select value={formData.riskLevel} onChange={e => handleInputChange('riskLevel', e.target.value)} options={['Low', 'Medium', 'High'].map(v => ({label:v, value:v}))} />
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={prevTab} disabled={activeTab === 'demo'}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={nextTab} disabled={activeTab === 'diag'}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <Button onClick={handleSubmit} disabled={submitting} className="min-w-[200px]">
              {submitting ? (
                <Activity className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Registering...' : 'Complete Intake'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddPatientModal;
