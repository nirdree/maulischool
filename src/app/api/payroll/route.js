import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import { EmployeeAttendance } from '@/models/Attendance';
import Employee from '@/models/Employee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

// ─── helpers ────────────────────────────────────────────────

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export async function getAttendanceSummary(employeeId, month, year) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);
  const records = await EmployeeAttendance.find({ employee: employeeId, date: { $gte: start, $lte: end } });

  let present = 0, absent = 0, late = 0, halfDay = 0, onLeave = 0, holidays = 0;
  for (const rec of records) {
    switch (rec.status) {
      case 'Present':  present++;  break;
      case 'Absent':   absent++;   break;
      case 'Late':     late++; present++; break;
      case 'HalfDay':  halfDay++;  break;
      case 'OnLeave':  onLeave++;  break;
      case 'Holiday':  holidays++; break;
    }
  }
  return { present, absent, late, halfDay, onLeave, holidays, effectivePresentDays: present + halfDay * 0.5 };
}

export function calculateSalary({ basicSalary, totalDays, holidays, daysPresent, bonus = 0, extraDeductions = 0 }) {
  const workingDays = Math.max(1, totalDays - holidays);
  const perDay      = basicSalary / workingDays;
  const earned      = Math.round(perDay * daysPresent * 100) / 100;
  const deductions  = Math.round((basicSalary - earned + extraDeductions) * 100) / 100;
  const netSalary   = Math.round((earned + Number(bonus)) * 100) / 100;
  return { workingDays, perDay, earned, deductions, netSalary };
}

// ─── routes ─────────────────────────────────────────────────

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get('employeeId'))   filter.employee     = searchParams.get('employeeId');
    if (searchParams.get('month'))        filter.month        = Number(searchParams.get('month'));
    if (searchParams.get('year'))         filter.year         = Number(searchParams.get('year'));
    if (searchParams.get('status'))       filter.status       = searchParams.get('status');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const records = await Payroll.find(filter)
      .populate('employee',    'name employeeId role monthlySalary')
      .populate('generatedBy', 'name')
      .populate('paidBy',      'name')
      .sort({ year: -1, month: -1 });

    return r.ok(records);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const {
      employee: employeeId, month, year, bonus = 0, extraDeductions = 0,
      paymentMode = 'BankTransfer', academicYear,
      manualOverride, daysPresent: manualDaysPresent, holidays: manualHolidays,
    } = body;

    if (!employeeId || !month || !year || !academicYear)
      return r.badRequest('employee, month, year, academicYear are required');

    const existing = await Payroll.findOne({ employee: employeeId, month: Number(month), year: Number(year) });
    if (existing) return r.conflict('Payroll already generated for this month');

    const emp = await Employee.findById(employeeId);
    if (!emp) return r.notFound('Employee not found');

    const totalDays = daysInMonth(Number(year), Number(month));
    let holidays, effectivePresentDays, summary;

    if (manualOverride) {
      holidays             = Number(manualHolidays ?? 0);
      effectivePresentDays = Number(manualDaysPresent ?? 0);
      summary = { present: Number(manualDaysPresent ?? 0), absent: 0, late: 0, halfDay: 0, onLeave: 0, holidays };
    } else {
      summary              = await getAttendanceSummary(employeeId, Number(month), Number(year));
      holidays             = summary.holidays;
      effectivePresentDays = summary.effectivePresentDays;
    }

    const calc = calculateSalary({
      basicSalary: emp.monthlySalary, totalDays, holidays,
      daysPresent: effectivePresentDays, bonus: Number(bonus), extraDeductions: Number(extraDeductions),
    });

    const record = await Payroll.create({
      employee: employeeId, month: Number(month), year: Number(year),
      basicSalary: emp.monthlySalary, totalDays, holidays,
      workingDays: calc.workingDays, perDaySalary: calc.perDay,
      daysPresent: effectivePresentDays, daysAbsent: summary.absent ?? 0,
      daysLate: summary.late ?? 0, daysHalfDay: summary.halfDay ?? 0, daysOnLeave: summary.onLeave ?? 0,
      earnedAmount: calc.earned, deductions: calc.deductions,
      extraDeductions: Number(extraDeductions), bonus: Number(bonus),
      netSalary: calc.netSalary, paymentMode, academicYear,
      generatedBy: request.user._id, manualOverride: !!manualOverride,
    });

    await record.populate('employee', 'name employeeId');
    return r.created(record, 'Payroll generated');
  } catch (err) {
    return r.serverError(err.message);
  }
});