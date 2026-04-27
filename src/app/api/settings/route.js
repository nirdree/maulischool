import { connectDB } from '@/lib/mongodb';
import { SchoolSettings } from '@/models/Others';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async () => {
  try {
    await connectDB();
    let settings = await SchoolSettings.findOne();
    if (!settings) settings = await SchoolSettings.create({});
    return r.ok(settings);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      settings = await SchoolSettings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }
    return r.ok(settings, 'Settings saved');
  } catch (err) {
    return r.serverError(err.message);
  }
});