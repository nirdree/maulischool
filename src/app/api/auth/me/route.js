import { protect } from '@/lib/auth';
import { r } from '@/lib/response';

export const GET = protect(async (request) => {
  return r.ok(request.user);
});