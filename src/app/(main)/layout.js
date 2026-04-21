'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap, LayoutDashboard, Users, UserCheck, School, BookOpen,
  CheckSquare, FileText, DollarSign, Banknote, CalendarDays, Bell, Clock,
  ArrowUpCircle, Settings, BarChart3, CalendarRange, LogOut, Menu, X,
  ChevronRight, ClipboardList,
} from 'lucide-react';

// ─── Role config ────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  admin: {
    accent: 'indigo',
    bg: 'bg-indigo-600',
    hover: 'bg-indigo-600',
    avatar: 'bg-indigo-500',
    dot: 'bg-indigo-400',
  },
  principal: {
    accent: 'indigo',
    bg: 'bg-indigo-600',
    hover: 'bg-indigo-600',
    avatar: 'bg-indigo-500',
    dot: 'bg-indigo-400',
  },
  teacher: {
    accent: 'emerald',
    bg: 'bg-emerald-600',
    hover: 'bg-emerald-600',
    avatar: 'bg-emerald-500',
    dot: 'bg-emerald-400',
  },
  parent: {
    accent: 'violet',
    bg: 'bg-violet-600',
    hover: 'bg-violet-600',
    avatar: 'bg-violet-500',
    dot: 'bg-violet-400',
  },
};

// ─── Nav items (role-gated) ──────────────────────────────────────────────────

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

// Role → base route prefix
const ROLE_PREFIX = {
  admin: 'admin',
  principal: 'admin',
  teacher: 'teacher',
  parent: 'parent',
};

// Roles allowed per portal
const ALLOWED_ROLES = {
  admin:     ['admin', 'principal'],
  teacher:   ['teacher'],
  parent:    ['parent'],
};

// ─── Unified Layout ──────────────────────────────────────────────────────────

export default function AppLayout({ children, portal = 'admin' }) {
  const { user, logout, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  if (!initialized) return null;

  // 🔐 Route protection
  const allowed = ALLOWED_ROLES[portal] ?? [];
  if (!user || !allowed.includes(user.role)) {
    router.replace('/login');
    return null;
  }

  const prefix   = ROLE_PREFIX[user.role] ?? portal;
  const theme    = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.admin;
  const navItems = ALL_NAV.filter(n => n.roles.includes(user.role));

  const isActive = (path) => pathname.startsWith(`/${prefix}/${path}`);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`${open ? 'w-64' : 'w-16'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}
      >
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center shrink-0`}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Sunrise School</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="ml-auto text-slate-400 hover:text-white shrink-0"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={`${user.role}-${path}`}
                href={`/${prefix}/${path}`}
                title={!open ? label : ''}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                  active
                    ? `${theme.hover} text-white`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {open && <span className="flex-1 truncate">{label}</span>}
                {open && (
                  <ChevronRight
                    className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full ${theme.avatar} flex items-center justify-center text-xs font-bold shrink-0`}
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email ?? user.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}