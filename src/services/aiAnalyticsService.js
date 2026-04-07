// AI Analytics Service — Mock + ready-to-plug Gemini architecture

const MOCK_INSIGHTS = [
  {
    type: 'peak_hours',
    title: 'Horas Pico de Asistencia',
    insight: 'El mayor flujo de usuarios se registra entre las 5:00 PM y 7:00 PM de lunes a viernes, con un promedio de 65 visitantes por hora. Se recomienda reforzar el personal de vigilancia y ampliar carriles disponibles en ese horario.',
    severity: 'info',
    metric: '+38% vs promedio',
  },
  {
    type: 'membership_trend',
    title: 'Tendencia de Membresías',
    insight: 'Las membresías mensuales han incrementado un 22% respecto al mes anterior. Sin embargo, las membresías anuales muestran una caída del 8%. Se sugiere lanzar una campaña promocional de membresías anuales con incentivos de temporada.',
    severity: 'warning',
    metric: '+22% mensual / -8% anual',
  },
  {
    type: 'occupancy',
    title: 'Análisis de Ocupación por Alberca',
    insight: 'La Alberca Principal opera al 82% de capacidad durante fines de semana, alcanzando saturación en periodos de 10am-12pm. La Alberca Recreativa tiene capacidad subutilizada del 34%. Se recomienda redistribuir actividades de aqua fitness a la Alberca Principal en fines de semana.',
    severity: 'warning',
    metric: '82% ocupación máx.',
  },
  {
    type: 'revenue_projection',
    title: 'Proyección de Ingresos',
    insight: 'Basado en los patrones de los últimos 7 meses, se proyecta un ingreso de $42,500 MXN para agosto, representando un crecimiento del 12% respecto al mes actual. Los talleres especiales y eventos contribuyen un 18% del ingreso total.',
    severity: 'success',
    metric: 'Proyección: $42,500',
  },
  {
    type: 'churn_risk',
    title: 'Riesgo de Abandono de Usuarios',
    insight: '23 usuarios con membresía mensual no han registrado asistencia en los últimos 15 días. Este grupo representa $8,050 MXN en riesgo de no renovación. Se recomienda enviar notificaciones personalizadas y ofrecer un descuento del 10% en renovación anticipada.',
    severity: 'danger',
    metric: '23 usuarios en riesgo',
  },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const aiAnalyticsService = {
  generateInsights: async (attendanceData, revenueData) => {
    // Simulate API call delay
    await delay(2000);

    // In production, call Gemini:
    // const prompt = buildPrompt(attendanceData, revenueData);
    // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {...});
    // return parseGeminiResponse(response);

    return {
      success: true,
      insights: MOCK_INSIGHTS,
      generatedAt: new Date().toISOString(),
      model: 'Gemini 2.0 Flash (Mock)',
    };
  },

  generateSingleInsight: async (type) => {
    await delay(800);
    const insight = MOCK_INSIGHTS.find(i => i.type === type) || MOCK_INSIGHTS[0];
    return { success: true, insight };
  },

  // Ready-to-plug: replace with real Gemini API call
  callGeminiAPI: async (prompt, apiKey) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    return response.json();
  },
};
