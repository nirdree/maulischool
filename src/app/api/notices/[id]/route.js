import { connectDB } from '@/lib/mongodb';
import { Notice } from '@/models/Others';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const notice = await Notice.findById(id).populate('createdBy', 'name');
    if (!notice) return r.notFound('Notice not found');
    return r.ok(notice);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const notice = await Notice.findByIdAndUpdate(id, await request.json(), { new: true });
    if (!notice) return r.notFound('Notice not found');
    return r.ok(notice, 'Notice updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    await Notice.findByIdAndDelete(id);
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
