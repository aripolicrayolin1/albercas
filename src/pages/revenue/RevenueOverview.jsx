import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { mockRevenueByMonth, mockRevenueByCategory, mockPayments, mockStats } from '../../data/mockData';
import { Download, TrendingUp, DollarSign, CreditCard } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

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
  const monthlyRevenue = {
    labels: mockRevenueByMonth.labels,
    datasets: [{
      data: mockRevenueByMonth.data,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
    }],
  };

  const categoryBars = {
    labels: mockRevenueByCategory.labels,
    datasets: [{
      data: mockRevenueByCategory.data,
      backgroundColor: DONUT_COLORS,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const donutData = {
    labels: mockRevenueByCategory.labels,
    datasets: [{
      data: mockRevenueByCategory.data,
      backgroundColor: DONUT_COLORS,
      borderColor: '#1e293b',
      borderWidth: 3,
    }],
  };

  const totalRevenue = mockRevenueByMonth.data.reduce((a, b) => a + b, 0);
  const completedPayments = mockPayments.filter(p => p.status === 'completado');
  const pendingAmount = mockPayments.filter(p => p.status === 'pendiente').reduce((a, p) => a + p.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingresos y Reportes</h1>
          <p className="page-subtitle">Análisis financiero del sistema municipal</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" id="export-revenue-btn">
            <Download size={15} /> Exportar Reporte
          </button>
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
            <div className="stat-label">Ingresos 2024 (acum.)</div>
            <div className="stat-change up">+22% vs 2023</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#6366f1', '--stat-bg': 'rgba(99,102,241,0.12)' }}>
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">${mockStats.monthlyRevenue.toLocaleString()}</div>
            <div className="stat-label">Este Mes</div>
            <div className="stat-change up">+12% vs mes ant.</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#f59e0b', '--stat-bg': 'rgba(245,158,11,0.12)' }}>
          <div className="stat-icon"><CreditCard size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{completedPayments.length}</div>
            <div className="stat-label">Transacciones</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#ef4444', '--stat-bg': 'rgba(239,68,68,0.12)' }}>
          <div className="stat-icon">⏳</div>
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
            <div className="card-subtitle">Enero — Julio 2024</div>
          </div>
        </div>
        <div className="chart-container" style={{ height: 280 }}>
          <Line data={monthlyRevenue} options={CHART_OPTS} />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ingresos por Categoría</div>
          </div>
          <div className="chart-container" style={{ height: 260 }}>
            <Bar data={categoryBars} options={{ ...CHART_OPTS, indexAxis: 'y', scales: {
              ...CHART_OPTS.scales,
              x: { ...CHART_OPTS.scales.x, ticks: { ...CHART_OPTS.scales.x.ticks, callback: v => `$${(v/1000).toFixed(0)}k` } },
            }}} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Distribución por Servicio</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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
              {mockRevenueByCategory.labels.map((label, i) => (
                <div key={label} className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    ${mockRevenueByCategory.data[i].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
