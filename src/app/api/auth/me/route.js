import { protect } from '@/lib/auth';
import { r } from '@/lib/response';

export const GET = protect(async (request) => {
  await request.user.populate('employeeId', 'name employeeId');
  return r.ok(request.user);
});