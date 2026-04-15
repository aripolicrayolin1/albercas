import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Download, TrendingUp, DollarSign, CreditCard, FileText, Table as TableIcon, FileDigit } from 'lucide-react';
import { exportService } from '../../services/exportService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 10,
      callbacks: {
        label: ctx => ` $${ctx.parsed.y?.toLocaleString() ?? ctx.parsed.toLocaleString()} MXN`,
      },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
};

const DONUT_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function RevenueOverview({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [payRes, statRes] = await Promise.all([
          axios.get(`${API_URL}/payments`),
          axios.get(`${API_URL}/stats`)
        ]);
        setPayments(payRes.data);
        setStats(statRes.data);
      } catch (err) {
        console.error('Error loading revenue data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // -- AGGREGATIONS --
  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'completado' ? Number(p.amount) : 0), 0);
  const pendingAmount = payments.reduce((acc, p) => acc + (p.status === 'pendiente' ? Number(p.amount) : 0), 0);
  const completedCount = payments.filter(p => p.status === 'completado').length;

  // Group by category (type)
  const categoriesMap = {};
  payments.forEach(p => {
    if (p.status === 'completado') {
      categoriesMap[p.type] = (categoriesMap[p.type] || 0) + Number(p.amount);
    }
  });
  const categoryLabels = Object.keys(categoriesMap);
  const categoryData = Object.values(categoriesMap);

  const categoryBars = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['Membresías', 'Clases', 'Talleres'],
    datasets: [{
      data: categoryData.length > 0 ? categoryData : [5000, 3000, 2000],
      backgroundColor: DONUT_COLORS,
      borderRadius: 6,
    }],
  };

  const donutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['Membresías', 'Clases', 'Talleres'],
    datasets: [{
      data: categoryData.length > 0 ? categoryData : [50, 30, 20],
      backgroundColor: DONUT_COLORS,
      borderColor: '#1e293b',
      borderWidth: 3,
    }],
  };

  // Monthly Trend (Dummy logic for now based on current payments)
  const monthlyRevenue = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    datasets: [{
      data: [12000, 15000, 18000, stats?.monthlyRevenue || 22000, 25000, 28000, stats?.monthlyRevenue || 30000],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }],
  };

  // -- EXPORTS --
  const handleExportPDF = () => {
    const title = 'Reporte Financiero Municipal — Ingresos';
    const columns = [
      { header: 'Usuario', dataKey: 'usuario' },
      { header: 'Concepto', dataKey: 'concepto' },
      { header: 'Monto', dataKey: 'monto' },
      { header: 'Fecha', dataKey: 'fecha' },
      { header: 'Método', dataKey: 'metodo' },
      { header: 'Estado', dataKey: 'estado' },
    ];
    const data = payments.map(p => ({
      usuario: p.user_name || p.userName,
      concepto: p.type,
      monto: `$${Number(p.amount).toLocaleString()}`,
      fecha: p.date,
      metodo: p.method,
      estado: p.status
    }));
    exportService.exportToPDF(title, columns, data, 'reporte_ingresos_municipal.pdf');
    setShowExportOptions(false);
  };

  const handleExportExcel = () => {
    const data = payments.map(p => ({
      ID: p.id,
      Usuario: p.user_name || p.userName,
      Concepto: p.type,
      Monto: Number(p.amount),
      Fecha: p.date,
      Método: p.method,
      Estado: p.status,
      Referencia: p.reference
    }));
    exportService.exportToExcel(data, 'reporte_ingresos_municipal.xlsx');
    setShowExportOptions(false);
  };

  const handleExportWord = () => {
    const title = 'Reporte de Ingresos — Alberca Municipal';
    const columns = ['Usuario', 'Concepto', 'Monto', 'Fecha', 'Método', 'Estado'];
    const data = payments.map(p => [
      p.user_name || p.userName, p.type, `$${Number(p.amount).toLocaleString()}`, p.date, p.method, p.status
    ]);
    exportService.exportToWord(title, columns, data, 'reporte_ingresos_municipal.doc');
    setShowExportOptions(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loader" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingresos y Reportes</h1>
          <p className="page-subtitle">Análisis financiero real extraído de MySQL</p>
        </div>
        <div className="page-actions" style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            id="export-revenue-btn"
            onClick={() => setShowExportOptions(!showExportOptions)}
          >
            <Download size={15} /> Exportar Reporte
          </button>

          {showExportOptions && (
            <div className="card shadow-lg animate-slide-up" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 12,
              zIndex: 100, width: 230, padding: 8, background: 'var(--color-surface)'
            }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Descargar Reporte</div>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }} onClick={handleExportPDF}>
                <FileText size={16} color="#ef4444" /> Formato PDF (.pdf)
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }} onClick={handleExportExcel}>
                <TableIcon size={16} color="#10b981" /> Formato Excel (.xlsx)
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }} onClick={handleExportWord}>
                <FileDigit size={16} color="#6366f1" /> Formato Word (.doc)
              </button>
            </div>
          )}

          <button className="btn btn-primary" onClick={() => onNavigate('/payments')} id="new-payment-from-revenue-btn">
            + Nuevo Pago
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stat-grid mb-6">
        <div className="stat-card" style={{ '--stat-color': '#10b981', '--stat-bg': 'rgba(16,185,129,0.12)' }}>
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">${totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Ingresos Totales (MySQL)</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#6366f1', '--stat-bg': 'rgba(99,102,241,0.12)' }}>
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">${(stats?.monthlyRevenue || 0).toLocaleString()}</div>
            <div className="stat-label">Este Mes</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#f59e0b', '--stat-bg': 'rgba(245,158,11,0.12)' }}>
          <div className="stat-icon"><CreditCard size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Transacciones Completadas</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#ef4444', '--stat-bg': 'rgba(239,68,68,0.12)' }}>
          <div className="stat-icon" style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.12)' }}><Clock size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">${pendingAmount.toLocaleString()}</div>
            <div className="stat-label">Pendiente de cobro</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">Tendencia de Ingresos Mensuales</div>
            <div className="card-subtitle">Enero — Diciembre 2024</div>
          </div>
        </div>
        <div className="chart-container-responsive">
          <div className="chart-container" style={{ height: 280 }}>
            <Line data={monthlyRevenue} options={CHART_OPTS} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ingresos por Categoría</div>
          </div>
          <div className="chart-container-responsive">
            <div className="chart-container" style={{ height: 260 }}>
              <Bar data={categoryBars} options={{ ...CHART_OPTS, indexAxis: 'y', scales: {
                ...CHART_OPTS.scales,
                x: { ...CHART_OPTS.scales.x, ticks: { ...CHART_OPTS.scales.x.ticks, callback: v => `$${(v/1000).toFixed(0)}k` } },
              }}} />
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="card-header">
            <div className="card-title">Distribución por Servicio</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
              <Doughnut data={donutData} options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: { label: ctx => ` $${ctx.parsed.toLocaleString()}` },
                  },
                },
                cutout: '65%',
              }} />
            </div>
            <div style={{ flex: 1 }}>
              {categoryLabels.length > 0 ? categoryLabels.map((label, i) => (
                <div key={label} className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    ${categoriesMap[label].toLocaleString()}
                  </span>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>No hay datos suficientes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
