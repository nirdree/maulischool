import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    const role         = searchParams.get('role');
    const status       = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const search       = searchParams.get('search');
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);

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

    const query = Employee.find(filter)
      .populate('academicYear', 'name')
      .sort({ name: 1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [employees, total] = await Promise.all([
      query,
      pagination ? Employee.countDocuments(filter) : Promise.resolve(null),
    ]);

    return pagination
      ? r.ok(employees, 'Employees fetched', paginationMeta(total, pagination))
      : r.ok(employees);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  await connectDB();
  let employeeId;
  let userId;

  try {
    const body = await request.json();
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const { name, password, role, aadhaarNumber } = body;

    if (!name || !normalizedEmail || !password || !role || !aadhaarNumber) {
      return r.badRequest('name, email, password, role and aadhaarNumber are required');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingEmployeeByEmail = await Employee.findOne({ email: normalizedEmail });
    const existingEmployeeByAadhaar = await Employee.findOne({
      aadhaarNumber: String(aadhaarNumber).trim(),
    });
    if (existingUser || existingEmployeeByEmail || existingEmployeeByAadhaar) {
      return r.conflict('Email or Aadhaar Number already exists');
    }

    const employeePayload = { ...body, email: normalizedEmail, aadhaarNumber: String(aadhaarNumber).trim() };
    const employee = await Employee.create(employeePayload);
    employeeId = employee._id;

    const userDoc = new User({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role,
      employeeId: employee._id,
    });
    userId = userDoc._id;
    await userDoc.save();

    employee.user = userDoc._id;
    await employee.save();

    return r.created(employee, 'Employee created');
  } catch (err) {
    const cleanupErrors = [];
    if (userId) {
      try {
        await User.deleteOne({ _id: userId });
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (employeeId) {
      try {
        await Employee.deleteOne({ _id: employeeId });
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length) {
      console.error('Failed to clean up partially created employee records:', cleanupErrors);
    }

    if (err.code === 11000) return r.conflict('Email, employee ID, or Aadhaar Number already exists');
    return r.serverError(err.message);
  }
});