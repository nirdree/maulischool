import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';
import User from '@/models/User';
import { r } from './response';

// Wraps a handler and injects req.user
export function protect(handler) {
  return async (request, context) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer '))
      return r.unauthorized('Not authorized – no token');

    const token = authHeader.split(' ')[1];
    try {
      await connectDB();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || user.status !== 'active')
        return r.unauthorized('User inactive or not found');

      request.user = user; // attach user to request
      return handler(request, context);
    } catch {
      return r.unauthorized('Token invalid or expired');
    }
  };
}

// Role guard — wrap AFTER protect
export function authorize(...roles) {
  return (handler) => protect(async (request, context) => {
    if (!roles.includes(request.user.role))
      return r.forbidden(`Role '${request.user.role}' is not allowed`);
    return handler(request, context);
  });
}