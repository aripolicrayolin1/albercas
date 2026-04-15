// AI Analytics Service — Connected to real Gemini API via backend
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`) + ``;

export const aiAnalyticsService = {
  generateInsights: async () => {
    try {
      const res = await axios.post(`${API_URL}/analytics/generate-insights`);
      return res.data;
    } catch (err) {
      console.error('Error generating AI insights:', err);
      const msg = err.response?.data?.error || 'Error al conectar con el servicio de IA';
      return {
        success: false,
        error: msg,
        insights: [],
      };
    }
  },
};
