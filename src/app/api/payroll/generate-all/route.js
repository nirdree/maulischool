import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import Employee from '@/models/Employee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { getAttendanceSummary, calculateSalary } from '../route';

function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { month, year, paymentMode = 'BankTransfer', academicYear, preview = false } = await request.json();

    if (!month || !year || !academicYear)
      return r.badRequest('month, year, academicYear are required');

    const employees = await Employee.find({ status: 'active' });
    const totalDays = daysInMonth(Number(year), Number(month));
    let created = 0, skipped = 0;
    const previews = [], errors = [];

    for (const emp of employees) {
      const existing = await Payroll.findOne({ employee: emp._id, month: Number(month), year: Number(year) });
      if (existing) { skipped++; continue; }

      const summary = await getAttendanceSummary(emp._id, Number(month), Number(year));
      const calc    = calculateSalary({
        basicSalary: emp.monthlySalary, totalDays,
        holidays: summary.holidays, daysPresent: summary.effectivePresentDays,
      });

      if (preview) {
        previews.push({
          employee:    { _id: emp._id, name: emp.name, employeeId: emp.employeeId },
          totalDays, holidays: summary.holidays,
          workingDays: calc.workingDays, daysPresent: summary.effectivePresentDays, netSalary: calc.netSalary,
        });
        continue;
      }

      try {
        await Payroll.create({
          employee: emp._id, month: Number(month), year: Number(year),
          basicSalary: emp.monthlySalary, totalDays, holidays: summary.holidays,
          workingDays: calc.workingDays, perDaySalary: calc.perDay,
          daysPresent: summary.effectivePresentDays, daysAbsent: summary.absent,
          daysLate: summary.late, daysHalfDay: summary.halfDay, daysOnLeave: summary.onLeave,
          earnedAmount: calc.earned, deductions: calc.deductions,
          extraDeductions: 0, bonus: 0, netSalary: calc.netSalary,
          paymentMode, academicYear, generatedBy: request.user._id,
        });
        created++;
      } catch (err) {
        if (err.code === 11000) skipped++;
        else errors.push(`${emp.name}: ${err.message}`);
      }
    }

    if (preview) return r.ok({ previews, toCreate: previews.length, skipped }, 'Preview ready');
    return r.ok({ created, skipped, errors }, `Generated ${created} payroll records. Skipped ${skipped}.`);
  } catch (err) {
    return r.serverError(err.message);
  }
});