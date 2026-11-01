// pages/admin/Employees.jsx
/**
 * EMPLOYEES PAGE
 * APIs Used:
 *   GET    /api/employees               — list with filters
 *   POST   /api/employees               — create (also creates linked User)
 *   PUT    /api/employees/:id           — update profile (syncs name/email to User)
 *   PATCH  /api/employees/:id/status    — change status (syncs User.status)
 *   PATCH  /api/employees/:id/password  — reset password on linked User
 *   DELETE /api/employees/:id           — delete employee + linked User (cascade)
 */
'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Search, RefreshCw, Edit2, Trash2, KeyRound, MoreVertical, Filter } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select,
  Badge, Modal,
} from '@/components/ui.jsx';
import { validateEmployee, validateName, validateEmail, validatePassword, validateRole, validateMobileNo, validateAadhaarNumber, validateGender, validateDateOfJoining, validateMonthlySalary, validateEducation, validateExperienceYears, validateExperienceMonths, validateHomeAddress } from '@/lib/validation';

// ─── Constants ───────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: '',          label: 'All Roles'  },
  { value: 'teacher',   label: 'Teacher'    },
  { value: 'principal', label: 'Principal'  },
];

const STATUS_OPTIONS = [
  { value: '',         label: 'All Status' },
  { value: 'active',   label: 'Active'     },
  { value: 'inactive', label: 'Inactive'   },
  { value: 'resigned', label: 'Resigned'   },
];

const GENDER_OPTIONS = [
  { value: 'Male',   label: 'Male'   },
  { value: 'Female', label: 'Female' },
  { value: 'Other',  label: 'Other'  },
];

const MODAL_ROLE_OPTIONS = [
  { value: 'teacher',   label: 'Teacher'   },
  { value: 'principal', label: 'Principal' },
];

const EXPERIENCE_OPTIONS = Array.from({ length: 51 }, (_, i) => ({ value: String(i), label: String(i) }));

function statusColor(s) {
  if (s === 'active')   return 'green';
  if (s === 'inactive') return 'yellow';
  return 'red'; // resigned
}

// ─── Page ────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state — null = closed, 'add' = add form, Employee obj = edit form
  const [modal,        setModal]        = useState(null);
  const [filterOpen,   setFilterOpen]   = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)       params.set('search', search);
      if (roleFilter)   params.set('role',   roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`${API.EMPLOYEES.BASE}?${params}`);
      setEmployees(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [roleFilter, statusFilter, page]);

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this employee? Their login account will also be removed.'))) return;
    try {
      await api.delete(API.EMPLOYEES.BY_ID(id));
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(API.EMPLOYEES.STATUS(id), { status });
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
  };

  const RowActions = ({ e }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const onDoc = (evt) => { if (ref.current && !ref.current.contains(evt.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    return (
      <div className="relative" ref={ref}>
        <Button size="sm" variant="ghost" title="Actions" onClick={() => setOpen(v => !v)}>
          <MoreVertical className="w-4 h-4" />
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 z-50 rounded-lg bg-slate-900 border border-slate-700 shadow-lg py-1 min-w-[220px]">
            <button onClick={() => { setOpen(false); setModal(e); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit Profile</span>
            </button>
            <button onClick={() => { setOpen(false); setModal({ ...e, _passwordMode: true }); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <KeyRound className="w-4 h-4" />
              <span className="text-sm">Change Password</span>
            </button>
            {e.status === 'active' ? (
              <button onClick={() => { setOpen(false); handleStatusChange(e._id, 'inactive'); }}
                className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm">Deactivate</span>
              </button>
            ) : (
              <button onClick={() => { setOpen(false); handleStatusChange(e._id, 'active'); }}
                className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm">Activate</span>
              </button>
            )}
            {e.status !== 'resigned' && (
              <button onClick={() => { setOpen(false); handleStatusChange(e._id, 'resigned'); }}
                className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-sm">Mark Resigned</span>
              </button>
            )}
            <button onClick={() => { setOpen(false); handleDelete(e._id); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const columns = [
    { key: 'employeeId', label: 'ID' },
    {
      key: 'name',
      label: 'Employee',
      render: (e) => (
        <div>
          <p className="font-medium text-white">{e.name}</p>
          <p className="text-xs text-slate-500">{e.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (e) => <Badge label={e.role} color="indigo" />,
    },
    { key: 'mobileNo', label: 'Phone' },
    {
      key: 'monthlySalary',
      label: 'Salary',
      render: (e) => (
        <span className="text-emerald-400">₹{e.monthlySalary?.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (e) => <Badge label={e.status} color={statusColor(e.status)} />,
    },
    {
      key: 'actions',
      label: '',
      render: (e) => (<RowActions e={e} />),
    },
  ];

  const isModalOpen     = modal !== null;
  const isPasswordModal = modal?._passwordMode === true;
  const editEmployee    = isModalOpen && !isPasswordModal && modal !== 'add' ? modal : null;
  const pwEmployee      = isPasswordModal ? modal : null;

  return (
    <PageContent>
      <PageHeader
        title="Employees"
        subtitle={`${total} employee${total !== 1 ? 's' : ''}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button onClick={() => setModal('add')}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Employee</span>
            </Button>
          </>
        }
      />

      {/* Filters (hidden on mobile — use Filters button) */}
      <div className="hidden sm:flex flex-wrap gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (page === 1) fetchEmployees();
                else setPage(1);
              }
            }}
          />
        </div>
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-40"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-40"
        />
        <Button variant="ghost" onClick={fetchEmployees} title="Refresh" className="hidden sm:inline-flex">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <Card className="!p-0">
        <Table
          columns={columns}
          data={employees}
          loading={loading}
          emptyMessage="No employees found"
        />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      {/* Add / Edit modal */}
      <EmployeeModal
        open={isModalOpen && !isPasswordModal}
        onClose={() => setModal(null)}
        employee={editEmployee}
        onSuccess={() => { fetchEmployees(); setModal(null); }}
      />

      {/* Change password modal */}
      <PasswordModal
        open={!!pwEmployee}
        onClose={() => setModal(null)}
        employee={pwEmployee}
        onSuccess={() => setModal(null)}
      />

      {/* Filters modal (mobile) */}
      <FiltersModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={{ search, role: roleFilter, status: statusFilter }}
        onApply={(v) => {
          setSearch(v.search);
          setRoleFilter(v.role);
          setStatusFilter(v.status);
          setPage(1);
          fetchEmployees();
          setFilterOpen(false);
        }}
      />
    </PageContent>
  );
}

// ─── Add / Edit Employee Modal ───────────────────────────────

function FiltersModal({ open, onClose, values, onApply }) {
  const [local, setLocal] = useState(values);
  useEffect(() => { if (open) setLocal(values); }, [open, values]);
  const apply = () => onApply(local);
  const clear = () => setLocal({ search: '', role: '', status: '' });
  return (
    <Modal open={open} onClose={onClose} title="Filters" width="max-w-md">
      <div className="space-y-4">
        <Input label="Search" value={local.search}
          onChange={(e) => setLocal({ ...local, search: e.target.value })}
          placeholder="Search employees..." />
        <Select label="Role" value={local.role}
          onChange={(e) => setLocal({ ...local, role: e.target.value })}
          options={ROLE_OPTIONS} />
        <Select label="Status" value={local.status}
          onChange={(e) => setLocal({ ...local, status: e.target.value })}
          options={STATUS_OPTIONS} />
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={clear}>Clear</Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
}

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'teacher',
  mobileNo: '', aadhaarNumber: '', gender: 'Male', dateOfJoining: '',
  monthlySalary: '', education: '', experienceYears: '', experienceMonths: '', homeAddress: '',
};

function EmployeeModal({ open, onClose, employee, onSuccess }) {
  const isEdit = !!employee;
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  // Limit date picker to today or earlier
  const todayStr = (() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  useEffect(() => {
    if (employee) {
      // Parse experience string into years/months (expects formats like "X years Y months", "Xy Ym", or a single number for years)
      const parseExp = (s) => {
        const str = (s || '').toString().toLowerCase();
        const yearsMatch = str.match(/(\d+)\s*(y|year|years)/);
        const monthsMatch = str.match(/(\d+)\s*(m|month|months)/);
        if (yearsMatch || monthsMatch) {
          return {
            years: yearsMatch ? yearsMatch[1] : '',
            months: monthsMatch ? monthsMatch[1] : '',
          };
        }
        // If only a plain number is provided, treat it as years
        const plainNum = str.match(/^(\d+)$/);
        if (plainNum) return { years: plainNum[1], months: '' };
        return { years: '', months: '' };
      };
      const exp = parseExp(employee.experience);

      setForm({
        name:          employee.name          || '',
        email:         employee.email         || '',
        password:      '',   // never pre-fill password
        role:          employee.role          || 'teacher',
        mobileNo:      employee.mobileNo      || '',
        aadhaarNumber: employee.aadhaarNumber || '',
        gender:        employee.gender        || 'Male',
        dateOfJoining: employee.dateOfJoining
          ? employee.dateOfJoining.split('T')[0]
          : '',
        monthlySalary: employee.monthlySalary || '',
        education:     employee.education     || '',
        experienceYears: exp.years,
        experienceMonths: exp.months,
        homeAddress:   employee.homeAddress   || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFieldErrors({});
    setError('');
  }, [employee, open]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));

    // Per-field validation on change
    let msg = null;
    switch (k) {
      case 'name':           msg = validateName(v); break;
      case 'email':          msg = validateEmail(v); break;
      case 'password':       msg = validatePassword(v, { required: !isEdit }); break;
      case 'role':           msg = validateRole(v); break;
      case 'mobileNo':       msg = validateMobileNo(v); break;
      case 'aadhaarNumber':  msg = validateAadhaarNumber(v); break;
      case 'gender':         msg = validateGender(v); break;
      case 'dateOfJoining':  msg = validateDateOfJoining(v); break;
      case 'monthlySalary':  msg = validateMonthlySalary(v); break;
      case 'education':      msg = validateEducation(v); break;
      case 'experienceYears':  msg = validateExperienceYears(v); break;
      case 'experienceMonths': msg = validateExperienceMonths(v); break;
      case 'homeAddress':    msg = validateHomeAddress(v); break;
      default: break;
    }

    setFieldErrors((fe) => {
      const next = { ...fe };
      if (msg) next[k] = msg; else delete next[k];
      // Clear top-level error if nothing remains
      if (Object.keys(next).length === 0) setError('');
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');

    const { valid, errors } = validateEmployee(form, { isEdit });
    if (!valid) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Build payload with experience as a numeric years value (y + m/12)
    const formatExperienceYearsNumber = (years, months) => {
      const y = years ? parseInt(years, 10) : 0;
      const m = months ? parseInt(months, 10) : 0;
      const total = y + (m / 12);
      return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
    };

    const { experienceYears, experienceMonths, ...rest } = form;
    const payload = { ...rest, experience: formatExperienceYearsNumber(experienceYears, experienceMonths) };

    setSaving(true);
    try {
      if (isEdit) {
        // Strip password from update payload — use dedicated endpoint instead
        const { password, ...updatePayload } = payload;
        await api.put(API.EMPLOYEES.BY_ID(employee._id), updatePayload);
      } else {
        await api.post(API.EMPLOYEES.BASE, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      width="max-w-2xl"
    >
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Priya Patel"
          error={fieldErrors.name}
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="priya@school.com"
          error={fieldErrors.email}
        />

        {/* Password only shown on create */}
        {!isEdit && (
          <Input
            label="Password *"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Min 8 characters; include upper, lower, number, special"
            error={fieldErrors.password}
          />
        )}

        <Select
          label="Role *"
          value={form.role}
          onChange={(e) => set('role', e.target.value)}
          options={MODAL_ROLE_OPTIONS}
          error={fieldErrors.role}
        />
        <Input
          label="Mobile No *"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.mobileNo}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            set('mobileNo', digits);
          }}
          placeholder="9999999999"
          error={fieldErrors.mobileNo}
        />
        <Input
          label="Aadhaar Number *"
          type="tel"
          inputMode="numeric"
          maxLength={12}
          value={form.aadhaarNumber}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
            set('aadhaarNumber', digits);
          }}
          placeholder="123412341234"
          error={fieldErrors.aadhaarNumber}
        />
        <Select
          label="Gender"
          value={form.gender}
          onChange={(e) => set('gender', e.target.value)}
          options={GENDER_OPTIONS}
          error={fieldErrors.gender}
        />
        <Input
          label="Date of Joining *"
          type="date"
          value={form.dateOfJoining}
          onChange={(e) => set('dateOfJoining', e.target.value)}
          max={todayStr}
          error={fieldErrors.dateOfJoining}
        />
        <Input
          label="Monthly Salary *"
          type="number"
          inputMode="decimal"
          min={1}
          step={0.01}
          value={form.monthlySalary}
          onChange={(e) => {
            // Prevent negatives and non-numeric characters except '.'
            const cleaned = e.target.value
              .replace(/[^0-9.]/g, '')      // keep digits and decimal
              .replace(/(\..*)\./g, '$1'); // single decimal point
            set('monthlySalary', cleaned);
          }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          placeholder="25000"
          error={fieldErrors.monthlySalary}
        />
        <Input
          label="Education *"
          value={form.education}
          onChange={(e) => set('education', e.target.value)}
          placeholder="B.Ed, M.Sc"
          error={fieldErrors.education}
        />
        <Input
          label="Experience (Years)"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          step={1}
          value={form.experienceYears}
          onChange={(e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v === '') { set('experienceYears', ''); return; }
            const num = Math.max(0, Math.min(50, parseInt(v, 10)));
            set('experienceYears', String(num));
          }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
              e.preventDefault();
            }
          }}
          placeholder="0–50"
          error={fieldErrors.experienceYears}
        />
        <Input
          label="Experience (Months)"
          type="number"
          inputMode="numeric"
          min={0}
          max={11}
          step={1}
          value={form.experienceMonths}
          onChange={(e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v === '') { set('experienceMonths', ''); return; }
            const num = Math.max(0, Math.min(11, parseInt(v, 10)));
            set('experienceMonths', String(num));
          }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
              e.preventDefault();
            }
          }}
          placeholder="0–11"
          error={fieldErrors.experienceMonths}
        />
        <Input
          label="Home Address *"
          value={form.homeAddress}
          onChange={(e) => set('homeAddress', e.target.value)}
          placeholder="123, Main St"
          className="col-span-2"
          error={fieldErrors.homeAddress}
        />
      </div>

      {/* Edit-mode hint about password */}
      {isEdit && (
        <p className="mt-3 text-xs text-slate-500">
          To change this employee's password, use the{' '}
          <KeyRound className="inline w-3 h-3" /> key icon in the table.
        </p>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Change Password Modal ───────────────────────────────────

function PasswordModal({ open, onClose, employee, onSuccess }) {
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    setError('');

    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(API.EMPLOYEES.PASSWORD(employee._id), { password });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Password"
      width="max-w-md"
    >
      {employee && (
        <p className="mb-4 text-sm text-slate-400">
          Resetting password for{' '}
          <span className="text-white font-medium">{employee.name}</span>
          {' '}({employee.employeeId})
        </p>
      )}

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="New Password *"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 6 characters"
        />
        <Input
          label="Confirm Password *"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Updating…' : 'Update Password'}
        </Button>
      </div>
    </Modal>
  );
}