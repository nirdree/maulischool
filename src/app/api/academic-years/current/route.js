import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();
    const year = await AcademicYear.findOne({ isCurrent: true });
    if (!year) return r.notFound('No current academic year set');
    return r.ok(year);
  } catch (err) {
    return r.serverError(err.message);
  }
}