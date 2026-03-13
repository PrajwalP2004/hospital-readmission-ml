import apiClient from '../api/apiClient';

/**
 * Service for patient management — now powered by backend API.
 */
export const patientService = {
  /**
   * Fetch all patients from backend API.
   */
  getAll: async (params = {}) => {
    const response = await apiClient.get('/patients', { params });
    return response.patients || [];
  },

  /**
   * Fetch a single patient by MRN.
   */
  getById: async (mrn) => {
    return apiClient.get(`/patients/${mrn}`);
  },

  /**
   * Create a new patient record.
   */
  create: async (patientData) => {
    return apiClient.post('/patients', patientData);
  },

  /**
   * Update a patient record.
   */
  update: async (mrn, data) => {
    return apiClient.put(`/patients/${mrn}`, data);
  },
};

export default patientService;
