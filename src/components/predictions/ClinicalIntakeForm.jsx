import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, cn } from '../common/UIPrimitives';
import { Activity, Pill, User, Heart, ChevronRight, ChevronLeft, ClipboardList } from 'lucide-react';

const ClinicalIntakeForm = ({ onSubmit, initialData = {}, isLoading = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const medicineOptions = [
    { label: 'Select Status...', value: '' },
    { label: 'No', value: 'No' },
    { label: 'Steady', value: 'Steady' },
    { label: 'Up', value: 'Up' },
    { label: 'Down', value: 'Down' }
  ];

  const validateStep = (currentStep) => {
    const newErrors = {};
    const requiredFields = {
      1: ['race', 'gender', 'age', 'medical_specialty', 'payer_code', 'max_glu_serum'],
      2: ['time_in_hospital', 'num_lab_procedures', 'num_procedures', 'num_medications', 'number_emergency', 'number_inpatient', 'number_outpatient', 'number_diagnoses'],
      3: ['diag_1', 'insulin', 'A1Cresult', 'diabetesMed', 'metformin', 'glipizide', 'glyburide', 'pioglitazone', 'change']
    };

    requiredFields[currentStep].forEach(field => {
      const val = formData[field];
      if (val === undefined || val === '' || val === null) {
        newErrors[field] = 'Required field';
      }
      // Numeric validation for step 2
      if (currentStep === 2 && (val === undefined || val === '')) {
         newErrors[field] = 'Value required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(3)) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
              step === s ? "bg-blue-600 text-white shadow-lg shadow-blue-100" :
              step > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {s}
            </div>
            {s < 3 && <div className={cn("h-1 flex-1 mx-4 rounded-full", step > s ? "bg-emerald-200" : "bg-slate-100")} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 min-h-[400px]">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader icon={<User className="w-4 h-4" />} title="Demographics & Payer details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Race" value={formData.race} onChange={e => handleInputChange('race', e.target.value)} options={[{label:'Select Race...', value:''}, ...['Other', 'Caucasian', 'AfricanAmerican'].map(r => ({label:r, value:r}))]} error={errors.race} />
              <Select label="Gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} options={[{label:'Select Gender...', value:''}, {label:'Female',value:'Female'}, {label:'Male',value:'Male'}]} error={errors.gender} />
              <Select label="Age Range" value={formData.age} onChange={e => handleInputChange('age', e.target.value)} options={[{label:'Select Age...', value:''}, ...['[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)'].map(a => ({label:a, value:a}))]} error={errors.age} />
              <Select label="Medical Specialty" value={formData.medical_specialty} onChange={e => handleInputChange('medical_specialty', e.target.value)} options={[{label:'Select Specialty...', value:''}, ...['Other', 'InternalMedicine', 'Family/GeneralPractice', 'Cardiology', 'Surgery-General', 'Orthopedics', 'Gastroenterology', 'Nephrology'].map(s => ({label:s, value:s}))]} error={errors.medical_specialty} />
              <Select label="Payer Code" value={formData.payer_code} onChange={e => handleInputChange('payer_code', e.target.value)} options={[{label:'Select Payer...', value:''}, ...['Other', 'MC', 'HM', 'SP', 'BC', 'MD', 'CM'].map(v => ({label:v, value:v}))]} error={errors.payer_code} />
              <Select label="Max Glucose Serum" value={formData.max_glu_serum} onChange={e => handleInputChange('max_glu_serum', e.target.value)} options={[{label:'Select Glucose Level...', value:''}, ...['None', '>200', '>300', 'Norm'].map(v => ({label:v, value:v}))]} error={errors.max_glu_serum} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader icon={<Activity className="w-4 h-4" />} title="Hospital Utilization" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Days in Hospital" type="number" value={formData.time_in_hospital} onChange={e => handleInputChange('time_in_hospital', e.target.value)} error={errors.time_in_hospital} />
              <Input label="Lab Procedures" type="number" value={formData.num_lab_procedures} onChange={e => handleInputChange('num_lab_procedures', e.target.value)} error={errors.num_lab_procedures} />
              <Input label="Other Procedures" type="number" value={formData.num_procedures} onChange={e => handleInputChange('num_procedures', e.target.value)} error={errors.num_procedures} />
              <Input label="Total Medications" type="number" value={formData.num_medications} onChange={e => handleInputChange('num_medications', e.target.value)} error={errors.num_medications} />
              <Input label="ER Visits (Last Year)" type="number" value={formData.number_emergency} onChange={e => handleInputChange('number_emergency', e.target.value)} error={errors.number_emergency} />
              <Input label="Inpatient Visits (Last Year)" type="number" value={formData.number_inpatient} onChange={e => handleInputChange('number_inpatient', e.target.value)} error={errors.number_inpatient} />
              <Input label="Outpatient Visits (Last Year)" type="number" value={formData.number_outpatient} onChange={e => handleInputChange('number_outpatient', e.target.value)} error={errors.number_outpatient} />
              <Input label="Number of Diagnoses" type="number" value={formData.number_diagnoses} onChange={e => handleInputChange('number_diagnoses', e.target.value)} error={errors.number_diagnoses} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <SectionHeader icon={<Pill className="w-4 h-4" />} title="Diabetes & Pharmacotherapy" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                <Input label="Primary Diagnosis (ICD)" value={formData.diag_1} onChange={e => handleInputChange('diag_1', e.target.value)} error={errors.diag_1} />
                <Input label="Secondary Diagnosis" value={formData.diag_2} onChange={e => handleInputChange('diag_2', e.target.value)} error={errors.diag_2} />
                <Input label="Tertiary Diagnosis" value={formData.diag_3} onChange={e => handleInputChange('diag_3', e.target.value)} error={errors.diag_3} />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                <Select label="Insulin Status" value={formData.insulin} onChange={e => handleInputChange('insulin', e.target.value)} options={medicineOptions} error={errors.insulin}/>
                <Select label="A1C Result" value={formData.A1Cresult} onChange={e => handleInputChange('A1Cresult', e.target.value)} options={[{label:'Select A1C...', value:''}, ...['None', '>7', '>8', 'Norm'].map(v => ({label:v, value:v}))]} error={errors.A1Cresult}/>
                <Select label="Diabetes Med" value={formData.diabetesMed} onChange={e => handleInputChange('diabetesMed', e.target.value)} options={[{label:'Select Option...', value:''}, {label:'Yes',value:'Yes'}, {label:'No',value:'No'}]} error={errors.diabetesMed}/>
              </div>
              
              <Select label="Metformin" value={formData.metformin} onChange={e => handleInputChange('metformin', e.target.value)} options={medicineOptions} error={errors.metformin}/>
              <Select label="Glipizide" value={formData.glipizide} onChange={e => handleInputChange('glipizide', e.target.value)} options={medicineOptions} error={errors.glipizide}/>
              <Select label="Glyburide" value={formData.glyburide} onChange={e => handleInputChange('glyburide', e.target.value)} options={medicineOptions} error={errors.glyburide}/>
              <Select label="Pioglitazone" value={formData.pioglitazone} onChange={e => handleInputChange('pioglitazone', e.target.value)} options={medicineOptions} error={errors.pioglitazone}/>
              <Select label="Med Change" value={formData.change} onChange={e => handleInputChange('change', e.target.value)} options={[{label:'Select Change...', value:''}, {label:'No',value:'No'}, {label:'Change',value:'Ch'}]} error={errors.change}/>
            </div>
          </div>
        )}

        <div className="pt-8 flex items-center justify-between border-t border-slate-100">
          <Button 
            type="button"
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1 || isLoading}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {step < 3 ? (
            <Button 
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 border-none"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 border-none px-10"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                   <Activity className="w-4 h-4 animate-spin" />
                   <span>Analyzing Clinical Vector...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                   <Heart className="w-4 h-4" />
                   <span>Predict Readmission Risk</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">{icon}</div>
    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
  </div>
);

export default ClinicalIntakeForm;
