import { connectDB, supportsTransactions } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    const role         = searchParams.get('role');
    const status       = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const search       = searchParams.get('search');

    if (role)         filter.role         = role;
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter)
      .populate('academicYear', 'name')
      .sort({ name: 1 });

    return r.ok(employees);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  await connectDB();
  const useTxn = await supportsTransactions();
  const session = useTxn ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  try {
    const body = await request.json();
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const { name, password, role } = body;

    if (!name || !normalizedEmail || !password || !role) {
      if (session) await session.abortTransaction();
      return r.badRequest('name, email, password and role are required');
    }

    const existingUser     = session
      ? await User.findOne({ email: normalizedEmail }).session(session)
      : await User.findOne({ email: normalizedEmail });
    const existingEmployee = session
      ? await Employee.findOne({ email: normalizedEmail }).session(session)
      : await Employee.findOne({ email: normalizedEmail });
    if (existingUser || existingEmployee) {
      if (session) await session.abortTransaction();
      return r.conflict('Email already registered');
    }

    const employeePayload = { ...body, email: normalizedEmail };
    const [employee] = session
      ? await Employee.create([employeePayload], { session })
      : await Employee.create([employeePayload]);

    const userDoc = new User({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12), role, employeeId: employee._id });
    if (session) await userDoc.save({ session });
    else await userDoc.save();

    employee.user = userDoc._id;
    if (session) await employee.save({ session });
    else await employee.save();
    if (session) await session.commitTransaction();

    return r.created(employee, 'Employee created');
  } catch (err) {
    if (session) await session.abortTransaction();
    if (err.code === 11000) return r.conflict('Email or employee ID already exists');
    return r.serverError(err.message);
  } finally {
    if (session) session.endSession();
  }
});