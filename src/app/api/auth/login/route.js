import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { r } from '@/lib/response';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || '';
  const rawBody = await request.text();

  if (!rawBody) return {};

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw new Error(`Invalid JSON in login request: ${error.message}`);
    }
  }

  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
}

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await parseBody(request);
    if (!email || !password) return r.badRequest('Email and password required');

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' },
    }).select('+password');

    const passwordValid = user?.password && (
      (typeof user.password === 'string' && user.password.startsWith('$2') && await bcrypt.compare(password, user.password)) ||
      user.password === password
    );

    if (!user || !passwordValid) return r.unauthorized('Invalid credentials');

    if (!user.password.startsWith('$2') && user.password === password) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }

    if (user.status !== 'active') return r.unauthorized('Account is inactive');

    const token = signToken(user._id);
    return r.ok({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return r.serverError(err.message || 'Login failed');
  }
}