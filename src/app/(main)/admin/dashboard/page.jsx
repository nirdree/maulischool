'use client';
import { useEffect, useState } from 'react';
import { Users, UserCheck, School, DollarSign, CalendarDays, Bell, Loader2 } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';

// ─── Reusable UI primitives (inline-style versions) ──────────────────────────

function PageContent({ children }) {
  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800,
        color: '#f1f5f9', margin: '0 0 4px',
        letterSpacing: '-0.02em',
      }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 400 }}>{subtitle}</p>
      )}
    </div>
  );
}

const COLOR_MAP = {
  indigo: { bg: 'linear-gradient(135deg, #6366f1, #818cf8)', glow: '#6366f155', text: '#818cf8', soft: 'rgba(99,102,241,0.12)' },
  emerald:{ bg: 'linear-gradient(135deg, #10b981, #34d399)', glow: '#10b98155', text: '#34d399', soft: 'rgba(16,185,129,0.12)' },
  amber:  { bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: '#f59e0b55', text: '#fbbf24', soft: 'rgba(245,158,11,0.12)' },
  rose:   { bg: 'linear-gradient(135deg, #f43f5e, #fb7185)', glow: '#f43f5e55', text: '#fb7185', soft: 'rgba(244,63,94,0.12)' },
};

function StatCard({ label, value, icon: Icon, color = 'indigo', trend }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#0f172a' : '#0c1628',
        borderRadius: 16, padding: '20px',
        border: `1px solid ${hovered ? c.text + '44' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: hovered ? `0 8px 32px ${c.glow}` : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${c.glow}`,
          flexShrink: 0,
        }}>
          <Icon size={18} color="white" />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: '#475569',
        }}>
          {label}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {value ?? '—'}
        </p>
        {trend && (
          <p style={{ fontSize: 11, color: c.text, margin: 0, fontWeight: 500 }}>{trend}</p>
        )}
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#0c1628',
      borderRadius: 16, padding: 20,
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, children, color = '#6366f1' }) {
  return (
    <h3 style={{
      fontSize: 13, fontWeight: 700, color: '#e2e8f0',
      marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Icon size={15} color={color} />
      {children}
    </h3>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const ayRes = await api.get(API.ACADEMIC_YEARS.CURRENT);
        const ayId = ayRes.data?._id;
        const [overviewRes, noticesRes] = await Promise.all([
          api.get(`${API.REPORTS.OVERVIEW}?academicYear=${ayId}`),
          api.get(`${API.NOTICES.BASE}?academicYear=${ayId}`),
        ]);
        setOverview(overviewRes.data);
        setNotices(noticesRes.data?.slice(0, 5) || []);
      } catch (err) {
        console.log('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Loader2 size={32} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const stats     = overview?.students;
  const fees      = overview?.fees;
  const employees = overview?.employees;

  const totalStudents = stats?.total ?? 0;
  const approvedPct   = totalStudents ? ((stats?.approved ?? 0) / totalStudents) * 100 : 0;
  const reviewPct     = totalStudents ? ((stats?.underReview ?? 0) / totalStudents) * 100 : 0;

  const noticeDot = {
    Urgent: '#f43f5e',
    Important: '#f59e0b',
    Normal: '#475569',
  };

  return (
    <PageContent>
      <PageHeader title="Dashboard" subtitle="School management overview" />

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <StatCard label="Total Students"   value={stats?.total}       icon={Users}      color="indigo"  trend={`${stats?.approved ?? 0} approved`} />
        <StatCard label="Active Employees" value={employees?.active}  icon={UserCheck}  color="emerald" trend={`${employees?.total ?? 0} total`} />
        <StatCard label="Fee Collected"    value={fees?.collected ? `₹${(fees.collected / 1000).toFixed(0)}K` : '—'} icon={DollarSign} color="amber" trend="This year" />
        <StatCard label="Pending Leaves"   value={overview?.leaves?.pending} icon={CalendarDays} color="rose" trend="Awaiting action" />
      </div>

      {/* ── 2-column cards grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap: 16,
      }}>

        {/* Student Status */}
        <Card>
          <CardTitle icon={Users} color="#818cf8">Student Status</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Approved',     value: stats?.approved,   pct: approvedPct, color: '#10b981' },
              { label: 'Under Review', value: stats?.underReview, pct: reviewPct,   color: '#f59e0b' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{item.value ?? 0}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${item.pct}%`,
                    background: item.color,
                    borderRadius: 999,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Notices */}
        <Card>
          <CardTitle icon={Bell} color="#818cf8">Recent Notices</CardTitle>
          {notices.length === 0 ? (
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>No notices yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notices.map((n) => (
                <div key={n._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    marginTop: 4, width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: noticeDot[n.priority] ?? '#475569',
                    boxShadow: `0 0 6px ${noticeDot[n.priority] ?? '#475569'}88`,
                  }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px' }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                      {n.priority} · {new Date(n.publishDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Fee Summary */}
        <Card>
          <CardTitle icon={DollarSign} color="#fbbf24">Fee Overview</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Total Expected', value: fees?.total,     color: '#f1f5f9' },
              { label: 'Collected',      value: fees?.collected, color: '#34d399' },
              { label: 'Pending',        value: fees?.pending,   color: '#fb7185' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>
                  ₹{item.value?.toLocaleString() ?? 0}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardTitle icon={School} color="#818cf8">Quick Stats</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Active Classes',    value: overview?.classes?.total },
              { label: 'Total Employees',   value: employees?.total },
              { label: 'Active Employees',  value: employees?.active },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{item.label}</span>
                <span style={{
                  fontSize: 14, fontWeight: 700, color: '#f1f5f9',
                  background: 'rgba(99,102,241,0.1)', padding: '2px 10px',
                  borderRadius: 6,
                }}>
                  {item.value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </PageContent>
  );
}