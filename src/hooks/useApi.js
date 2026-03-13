import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API calls with loading/error states.
 */
const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      const errMsg = err.message || 'An unexpected error occurred';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, request, setData };
};

export default useApi;
