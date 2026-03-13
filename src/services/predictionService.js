import apiClient from '../api/apiClient';

/**
 * Service for interacting with the ML model endpoints.
 */
export const predictionService = {
  /**
   * Predict readmission risk for a patient.
   * @param {Object} data - Patient features (demographics, labs, etc.)
   */
  predict: async (data) => {
    return apiClient.post('/predict', data);
  },


  /**
   * Fetch the expected input schema for predictions.
   */
  getSchema: async () => {
    return apiClient.get('/schema');
  },

  /**
   * Verify API health.
   */
  getHealth: async () => {
    return apiClient.get('/health');
  }
};

export default predictionService;
