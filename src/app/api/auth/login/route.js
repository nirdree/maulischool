import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { r } from '@/lib/response';
import jwt from 'jsonwebtoken';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();
    if (!email || !password) return r.badRequest('Email and password required');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return r.unauthorized('Invalid credentials');

    if (user.status !== 'active') return r.unauthorized('Account is inactive');

    const token = signToken(user._id);
    return r.ok({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
  } catch (err) {
    return r.serverError(err.message);
  }
}