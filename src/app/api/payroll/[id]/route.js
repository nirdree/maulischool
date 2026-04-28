import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { calculateSalary } from '../route';

export const GET = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const record = await Payroll.findById(id)
      .populate('employee',    'name employeeId role monthlySalary email mobileNo')
      .populate('generatedBy', 'name')
      .populate('paidBy',      'name');
    if (!record) return r.notFound('Payroll record not found');
    return r.ok(record);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const record = await Payroll.findById(id).populate('employee', 'monthlySalary name');
    if (!record)                  return r.notFound('Payroll record not found');
    if (record.status === 'Paid') return r.badRequest('Cannot edit a paid payroll record');

    const body = await request.json();
    const { daysPresent, holidays, paymentMode, notes } = body;
    const bonus           = body.bonus           ?? record.bonus;
    const extraDeductions = body.extraDeductions ?? record.extraDeductions;

    const calc = calculateSalary({
      basicSalary:     record.basicSalary,
      totalDays:       record.totalDays,
      holidays:        holidays     ?? record.holidays,
      daysPresent:     daysPresent  ?? record.daysPresent,
      bonus:           Number(bonus),
      extraDeductions: Number(extraDeductions),
    });

    Object.assign(record, {
      daysPresent:     daysPresent  ?? record.daysPresent,
      holidays:        holidays     ?? record.holidays,
      workingDays:     calc.workingDays,
      perDaySalary:    calc.perDay,
      earnedAmount:    calc.earned,
      deductions:      calc.deductions,
      extraDeductions: Number(extraDeductions),
      bonus:           Number(bonus),
      netSalary:       calc.netSalary,
      ...(paymentMode && { paymentMode }),
      ...(notes       && { notes }),
    });

    await record.save();
    await record.populate('employee', 'name employeeId');
    return r.ok(record, 'Payroll updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const record = await Payroll.findById(id);
    if (!record)                  return r.notFound('Payroll record not found');
    if (record.status === 'Paid') return r.badRequest('Cannot delete a paid payroll record');
    await Payroll.findByIdAndDelete(id);
    return r.ok({ id }, 'Payroll record deleted');
  } catch (err) {
    return r.serverError(err.message);
  }
});
