'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap, LayoutDashboard, Users, UserCheck, School, BookOpen,
  CheckSquare, FileText, DollarSign, Banknote, CalendarDays, Bell, Clock,
  ArrowUpCircle, Settings, BarChart3, CalendarRange, LogOut, Menu, X,
  ChevronRight, ClipboardList,
} from 'lucide-react';

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin:     { primary: '#6366f1', light: '#818cf8', bg: '#1e1b4b', dot: '#a5b4fc' },
  principal: { primary: '#6366f1', light: '#818cf8', bg: '#1e1b4b', dot: '#a5b4fc' },
  teacher:   { primary: '#10b981', light: '#34d399', bg: '#064e3b', dot: '#6ee7b7' },
  parent:    { primary: '#8b5cf6', light: '#a78bfa', bg: '#2e1065', dot: '#c4b5fd' },
};

// ─── Nav items ────────────────────────────────────────────────────────────────
const ALL_NAV = [
  { label: 'Dashboard',      path: 'dashboard',       icon: LayoutDashboard, roles: ['admin', 'principal', 'teacher', 'parent'] },
  { label: 'Employees',      path: 'employees',       icon: UserCheck,       roles: ['admin', 'principal'] },
  { label: 'Classrooms',     path: 'classrooms',      icon: School,          roles: ['admin', 'principal'] },
  { label: 'Subjects',       path: 'subjects',        icon: BookOpen,        roles: ['admin', 'principal'] },
  { label: 'Students',       path: 'students',        icon: Users,           roles: ['admin', 'principal'] },
  { label: 'My Children',    path: 'my-children',     icon: GraduationCap,   roles: ['parent'] },
  { label: 'Timetable',      path: 'timetable',       icon: Clock,           roles: ['admin', 'principal', 'teacher', 'parent'] },
  { label: 'Attendance',     path: 'attendance',      icon: CheckSquare,     roles: ['admin', 'principal', 'teacher', 'parent'] },
  { label: 'Exams & Marks',  path: 'exams',           icon: FileText,        roles: ['admin', 'principal', 'teacher'] },
  { label: 'Marks',          path: 'marks',           icon: FileText,        roles: ['parent'] },
  { label: 'Homework',       path: 'homework',        icon: ClipboardList,   roles: ['teacher', 'parent'] },
  { label: 'Fees',           path: 'fees',            icon: DollarSign,      roles: ['admin', 'principal', 'parent'] },
  { label: 'Payroll',        path: 'payroll',         icon: Banknote,        roles: ['admin'] },
  { label: 'Leaves',         path: 'leaves',          icon: CalendarDays,    roles: ['admin', 'principal', 'teacher'] },
  { label: 'Notices',        path: 'notices',         icon: Bell,            roles: ['admin', 'principal', 'teacher', 'parent'] },
  { label: 'Promote',        path: 'promote',         icon: ArrowUpCircle,   roles: ['admin', 'principal'] },
  { label: 'Reports',        path: 'reports',         icon: BarChart3,       roles: ['admin', 'principal'] },
  { label: 'Academic Years', path: 'academic-years',  icon: CalendarRange,   roles: ['admin'] },
  { label: 'Enquiries',      path: 'enquiries',       icon: FileText,        roles: ['admin', 'principal'] },
  { label: 'Settings',       path: 'settings',        icon: Settings,        roles: ['admin'] },
];

const ROLE_PREFIX = { admin: 'admin', principal: 'admin', teacher: 'teacher', parent: 'parent' };
const ALLOWED_ROLES = { admin: ['admin', 'principal'], teacher: ['teacher'], parent: ['parent'] };

function SidebarContent({ isOpen, isMobile, theme, user, navItems, prefix, pathname, hoveredPath, setHoveredPath, setMobileOpen, setOpen, handleLogout }) {
  const isActive = (path) => pathname.startsWith(`/${prefix}/${path}`);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.light})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${theme.primary}55`,
        }}>
          <GraduationCap size={18} color="white" />
        </div>
        {isOpen && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.02em', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Mauli School
            </p>
            <p style={{ fontSize: 11, color: theme.light, textTransform: 'capitalize', margin: 0, fontWeight: 500 }}>
              {user.role}
            </p>
          </div>
        )}
        <button
          onClick={() => isMobile ? setMobileOpen(false) : setOpen(v => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {(isMobile || isOpen) ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path);
          const hovered = hoveredPath === path;
          return (
            <Link
              key={`${user.role}-${path}`}
              href={`/${prefix}/${path}`}
              title={!isOpen ? label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
              onMouseEnter={() => setHoveredPath(path)}
              onMouseLeave={() => setHoveredPath(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isOpen ? '9px 12px' : '9px 0', justifyContent: isOpen ? 'flex-start' : 'center',
                borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? 'white' : hovered ? '#e2e8f0' : '#94a3b8',
                background: active
                  ? `linear-gradient(135deg, ${theme.primary}cc, ${theme.primary}88)`
                  : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                boxShadow: active ? `0 2px 12px ${theme.primary}44` : 'none',
                transition: 'all 0.18s ease',
                position: 'relative',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 2px 2px 0',
                  background: theme.light,
                }} />
              )}
              <Icon size={16} style={{ flexShrink: 0 }} />
              {isOpen && (
                <>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                  <ChevronRight size={12} style={{ opacity: active || hovered ? 0.6 : 0, transition: 'opacity 0.18s' }} />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.light})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
          }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          {isOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email ?? user.role}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 6, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children, portal = 'admin' }) {
  const { user, logout, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setOpen(false);
      else setOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!initialized) return null;

  const allowed = ALLOWED_ROLES[portal] ?? [];
  if (!user || !allowed.includes(user.role)) {
    router.replace('/login');
    return null;
  }

  const prefix    = ROLE_PREFIX[user.role] ?? portal;
  const theme     = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.admin;
  const navItems  = ALL_NAV.filter(n => n.roles.includes(user.role));
  const handleLogout = () => { logout(); router.replace('/login'); };

  const sidebarProps = { theme, user, navItems, prefix, pathname, hoveredPath, setHoveredPath, setMobileOpen, setOpen, handleLogout };

  const sidebarWidth = open ? 240 : 64;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        a { text-decoration: none; }
      `}</style>

      <div style={{ display: 'flex', height: '100dvh', background: '#020617', color: 'white', overflow: 'hidden', fontFamily: "'Inter', -apple-system, sans-serif" }}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <aside style={{
            width: sidebarWidth, flexShrink: 0,
            background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
          }}>
            <SidebarContent isOpen={open} isMobile={isMobile} {...sidebarProps} />
          </aside>
        )}

        {/* ── Mobile overlay backdrop ── */}
        {isMobile && mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 40, backdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* ── Mobile Sidebar drawer ── */}
        {isMobile && (
          <aside style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: 240, zIndex: 50,
            background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1e 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <SidebarContent isOpen={true} isMobile={isMobile} {...sidebarProps} />
          </aside>
        )}

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile top bar */}
          {isMobile && (
            <div style={{
              height: 56, flexShrink: 0,
              background: '#0f172a',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
            }}>
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', width: 36, height: 36, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Menu size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.light})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GraduationCap size={14} color="white" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Mauli School</span>
              </div>
            </div>
          )}

          <main style={{ flex: 1, overflowY: 'auto', background: '#020617' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}