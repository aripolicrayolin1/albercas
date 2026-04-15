import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`) + ``;

const SEVERITY_CONFIG = {
  info: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: Info, label: 'Información' },
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: CheckCircle, label: 'Positivo' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: AlertTriangle, label: 'Atención' },
  danger: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle, label: 'Crítico' },
};

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
  },
  scales: {
    x: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
    y: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
};

function TypingText({ text }) {
  const [displayed, setDisplayed] = useState('');
  React.useEffect(() => {
    if (!text) return;
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      {displayed.length < text?.length && <span className="ai-typing-cursor" />}
    </span>
  );
}

export default function AttendanceAnalytics() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Datos reales del backend
  const [hourlyChart, setHourlyChart] = useState({ labels: [], data: [] });
  const [weeklyChart, setWeeklyChart] = useState({ labels: [], data: [] });

  useEffect(() => {
    const fetchReal = async () => {
      try {
        const [hRes, dRes] = await Promise.all([
          axios.get(`${API_URL}/analytics/attendance-by-hour`),
          axios.get(`${API_URL}/analytics/attendance-by-day`)
        ]);
        setHourlyChart(hRes.data);
        setWeeklyChart(dRes.data);
      } catch (err) {
        console.error("Error al cargar analíticas:", err);
      }
    };
    fetchReal();
  }, []);

  const generate = async () => {
    setLoading(true);
    setInsights(null);
    setAiError(null);
    const result = await aiAnalyticsService.generateInsights();
    setLoading(false);
    if (result.success) {
      setInsights(result.insights);
      setGeneratedAt(new Date(result.generatedAt).toLocaleString('es-MX'));
    } else {
      setAiError(result.error || 'Error desconocido al generar análisis');
    }
  };

  const hasData = hourlyChart.data.some(v => v > 0) || weeklyChart.data.some(v => v > 0);

  const hourlyData = {
    labels: hourlyChart.labels,
    datasets: [{
      data: hourlyChart.data,
      backgroundColor: hourlyChart.data.map(v =>
        v > 0 ? 'rgba(99,102,241,0.85)' : 'rgba(99,102,241,0.15)'
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const weeklyData = {
    labels: weeklyChart.labels,
    datasets: [{
      data: weeklyChart.data,
      backgroundColor: weeklyChart.data.map(v =>
        v > 0 ? 'rgba(34,211,238,0.85)' : 'rgba(34,211,238,0.15)'
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analítica con Inteligencia Artificial</h1>
          <p className="page-subtitle">Patrones de asistencia y recomendaciones generadas por IA</p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={generate}
          disabled={loading || !hasData}
          id="generate-ai-insights-btn"
        >
          {loading
            ? <><span className="loader" style={{ width: 18, height: 18 }} /> Analizando...</>
            : <><Brain size={18} /> Generar Análisis</>}
        </button>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-6" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Asistencia por Hora</div>
              <div className="card-subtitle">Entradas registradas por hora (datos reales)</div>
            </div>
            <TrendingUp size={16} color="var(--color-text-muted)" />
          </div>
          <div className="chart-container-responsive">
            <div className="chart-container">
              {!hasData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Sin registros de asistencia aún. Los datos aparecerán al usar el escáner NFC.
                </div>
              ) : (
                <Bar data={hourlyData} options={CHART_OPTS} />
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Asistencia Semanal</div>
              <div className="card-subtitle">Entradas por día de semana (datos reales)</div>
            </div>
          </div>
          <div className="chart-container-responsive">
            <div className="chart-container">
              {!hasData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  Sin registros de asistencia aún.
                </div>
              ) : (
                <Bar data={weeklyData} options={CHART_OPTS} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {aiError && (
        <div className="card mb-4" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Error al generar análisis</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{aiError}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI panel */}
      {!insights && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}>
            <Brain size={32} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Análisis con IA disponible</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: 420, margin: '0 auto var(--space-6)' }}>
            {hasData
              ? 'Presiona "Generar Análisis" para obtener insights automáticos sobre los patrones reales de asistencia de tu alberca.'
              : 'Aún no hay registros de asistencia. Usa el escáner NFC para registrar entradas y los datos aparecerán aquí automáticamente.'}
          </div>
          {hasData && (
            <button className="btn btn-primary btn-lg" onClick={generate} id="generate-insights-center-btn">
              <Brain size={18} /> Generar Análisis IA
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}>
            <Brain size={32} color="var(--color-primary)" style={{ animation: 'pulse 1s ease infinite' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Procesando datos con IA...</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Analizando patrones de asistencia, ingresos y tendencias del sistema
          </div>
          <div className="loader" style={{ margin: 'var(--space-4) auto 0', width: 24, height: 24 }} />
        </div>
      )}

      {insights && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Insights Generados por IA</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Modelo: Gemini 2.0 Flash · {generatedAt}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={generate} id="regenerate-insights-btn">
              <RefreshCw size={13} /> Regenerar
            </button>
          </div>

          {insights.map((insight) => {
            const config = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
            const IconComponent = config.icon;
            return (
              <div
                key={insight.type}
                className="ai-insight"
                style={{ '--insight-color': config.color, background: config.bg, borderColor: `${config.color}33` }}
              >
                <div className="ai-insight-header">
                  <div className="ai-insight-icon" style={{ background: `linear-gradient(135deg, ${config.color}, color-mix(in srgb, ${config.color} 70%, #22d3ee))` }}>
                    <IconComponent size={14} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{insight.title}</div>
                    <span className="badge" style={{ background: `${config.color}22`, color: config.color, marginTop: 2 }}>
                      {insight.metric}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
                  <TypingText text={insight.insight} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
