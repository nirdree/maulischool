import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const employee = await Employee.findById(id)
      .populate('academicYear', 'name')
      .populate('user', 'email status');
    if (!employee) return r.notFound('Employee not found');
    return r.ok(employee);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { password, ...updateData } = body;

    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true, runValidators: true,
    }).populate('user', 'email status');

    if (!employee) return r.notFound('Employee not found');

    if (employee.user) {
      const userUpdate = {};
      if (updateData.name)  userUpdate.name  = updateData.name;
      if (updateData.email) userUpdate.email = updateData.email;
      if (Object.keys(userUpdate).length) {
        await User.findByIdAndUpdate(employee.user._id || employee.user, userUpdate);
      }
    }

    return r.ok(employee, 'Employee updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  await connectDB();
  const { id } = await params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const employee = await Employee.findByIdAndDelete(id).session(session);
    if (!employee) {
      await session.abortTransaction();
      return r.notFound('Employee not found');
    }
    if (employee.user) await User.findByIdAndDelete(employee.user).session(session);
    await session.commitTransaction();
    return r.noContent();
  } catch (err) {
    await session.abortTransaction();
    return r.serverError(err.message);
  } finally {
    session.endSession();
  }
});
