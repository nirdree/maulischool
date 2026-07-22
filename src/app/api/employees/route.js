import { connectDB } from '@/lib/mongodb';
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = await request.json();
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const { name, password, role } = body;

    if (!name || !normalizedEmail || !password || !role) {
      await session.abortTransaction();
      return r.badRequest('name, email, password and role are required');
    }

    const existingUser     = await User.findOne({ email: normalizedEmail }).session(session);
    const existingEmployee = await Employee.findOne({ email: normalizedEmail }).session(session);
    if (existingUser || existingEmployee) {
      await session.abortTransaction();
      return r.conflict('Email already registered');
    }

    const employeePayload = { ...body, email: normalizedEmail };
    const [employee] = await Employee.create([employeePayload], { session });

    const userDoc = new User({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12), role, employeeId: employee._id });
    await userDoc.save({ session });

    employee.user = userDoc._id;
    await employee.save({ session });
    await session.commitTransaction();

    return r.created(employee, 'Employee created');
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) return r.conflict('Email or employee ID already exists');
    return r.serverError(err.message);
  } finally {
    session.endSession();
  }
});