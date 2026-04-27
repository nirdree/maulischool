import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { getAttendanceSummary, calculateSalary } from '../route';

function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const employeeId     = searchParams.get('employeeId');
    const month          = searchParams.get('month');
    const year           = searchParams.get('year');
    const bonus          = Number(searchParams.get('bonus') || 0);
    const extraDeductions = Number(searchParams.get('extraDeductions') || 0);
    const manualHolidays = searchParams.get('manualHolidays');

    if (!employeeId || !month || !year)
      return r.badRequest('employeeId, month, year required');

    const emp = await Employee.findById(employeeId);
    if (!emp) return r.notFound('Employee not found');

    const totalDays = daysInMonth(Number(year), Number(month));
    const summary   = await getAttendanceSummary(employeeId, Number(month), Number(year));
    const holidays  = manualHolidays !== null ? Number(manualHolidays) : summary.holidays;

    const calc = calculateSalary({
      basicSalary: emp.monthlySalary, totalDays, holidays,
      daysPresent: summary.effectivePresentDays, bonus, extraDeductions,
    });

    return r.ok({
      employee: { name: emp.name, monthlySalary: emp.monthlySalary },
      totalDays, holidays, ...summary, ...calc, bonus, extraDeductions,
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});