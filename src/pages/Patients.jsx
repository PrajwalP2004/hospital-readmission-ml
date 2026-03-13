import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, MoreVertical, FileText, UserPlus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, Button, Input, Select, cn } from '../components/common/UIPrimitives';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import useApi from '../hooks/useApi';
import patientService from '../services/patientService';
import AddPatientModal from '../components/common/AddPatientModal';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const itemsPerPage = 10;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        risk: riskFilter === 'all' ? undefined : riskFilter,
        search: searchTerm || undefined
      };
      const response = await patientService.getAll(params);
      // The API returns { patients: [], total: X }
      // But patientService.getAll currently returns response.patients || [] 
      // I should update patientService.getAll to return the full response or handle it here
      // Let's check patientService.js again.
      // patientService.getAll: async (params = {}) => { const response = await apiClient.get('/patients', { params }); return response.patients || []; }
      // Wait, I need the total count too.
      
      // I'll make a direct call for now to get the total count if I haven't updated the service
      const fullResponse = await import('../api/apiClient').then(m => m.default.get('/patients', { params }));
      setPatients(fullResponse.patients || []);
      setTotalCount(fullResponse.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, riskFilter, searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchPatients]);

  // Reset to page 1 on search/filter
  useEffect(() => { setCurrentPage(1); }, [searchTerm, riskFilter]);

  const handleAddPatient = async (patientData) => {
    try {
      await patientService.create(patientData);
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && patients.length === 0) return <LoadingSpinner fullPage label="Syncing with patient registry …" />;

  return (
    <div className="space-y-8 animate-fade-in stagger-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Registry</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and track patient readmission risk history.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button className="flex items-center space-x-2" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </Button>
        </div>
      </div>

      <AddPatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddPatient} 
      />

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 max-w-md relative">
            <Input 
              placeholder="Search by name or MRN …" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white pl-10"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="w-48">
              <Select 
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                options={[
                  { label: 'All Risk Levels', value: 'all' },
                  { label: 'High Risk', value: 'high' },
                  { label: 'Medium Risk', value: 'medium' },
                  { label: 'Low Risk', value: 'low' },
                ]}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchPatients} className="mb-6" />}

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <LoadingSpinner label="" />
            </div>
          )}
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-3">Patient Details</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Risk Level</th>
                <th className="px-6 py-3">Clinical Metrics</th>
                <th className="px-6 py-3">Admission Date</th>
                <th className="px-1 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.mrn} className="group hover:bg-slate-50 transition-all rounded-xl">
                  <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-50 group-hover:border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {patient.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1.5">{patient.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.mrn} • {patient.age}y {patient.gender?.[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-y border-slate-50 group-hover:border-slate-100">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 border-y border-slate-50 group-hover:border-slate-100">
                    <RiskBadge level={patient.risk_level || patient.riskLevel} />
                  </td>
                  <td className="px-6 py-4 border-y border-slate-50 group-hover:border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{patient.time_in_hospital}d Hosp</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.num_medications} Meds</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-y border-slate-50 group-hover:border-slate-100 text-sm font-medium text-slate-500">
                    {patient.admitted}
                  </td>
                  <td className="px-6 py-4 rounded-r-2xl border-y border-r border-slate-50 group-hover:border-slate-100 text-right">
                    <button className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-300 hover:text-slate-600 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!loading && patients.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium italic">No patients found matching your search criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
            </p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="h-9 w-9 p-0 flex items-center justify-center rounded-lg"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "h-9 w-9 rounded-lg text-xs font-black transition-all",
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                          : "text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                className="h-9 w-9 p-0 flex items-center justify-center rounded-lg"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const RiskBadge = ({ level }) => {
  const styles = {
    High: "bg-red-50 text-red-600 border-red-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Unknown: "bg-slate-50 text-slate-400 border-slate-100",
  };

  const displayLevel = level || 'Unknown';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${styles[displayLevel] || styles.Unknown}`}>
      {displayLevel}
    </span>
  );
};

export default Patients;
