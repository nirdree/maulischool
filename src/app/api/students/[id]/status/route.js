import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

async function syncParentStatus(student, desiredStatus) {
  const seen = new Set();
  for (const userId of [student.fatherUser, student.motherUser]) {
    if (!userId) continue;
    const uid = String(userId);
    if (seen.has(uid)) continue;
    seen.add(uid);
    const user = await User.findById(userId).select('studentIds');
    if (!user) continue;
    if (desiredStatus === 'inactive') {
      const activeCount = await Student.countDocuments({
        _id:    { $in: user.studentIds, $ne: student._id },
        status: { $in: ['Approved', 'UnderReview'] },
      });
      if (activeCount === 0) await User.findByIdAndUpdate(userId, { status: 'inactive' });
    } else {
      await User.findByIdAndUpdate(userId, { status: 'active' });
    }
  }
}

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const { status, rejectionRemark, holdRemark, leavingReason, leavingDate } = await request.json();
    const allowed = ['UnderReview', 'Approved', 'Rejected', 'OnHold', 'Left', 'Alumni'];
    if (!allowed.includes(status)) return r.badRequest('Invalid status');

    const student = await Student.findById(id);
    if (!student) return r.notFound('Student not found');

    const update = { status };
    if (rejectionRemark) update.rejectionRemark = rejectionRemark;
    if (holdRemark)      update.holdRemark      = holdRemark;
    if (leavingReason)   update.leavingReason   = leavingReason;
    if (leavingDate)     update.leavingDate     = leavingDate;

    if (status === 'Approved') {
      const count = await Student.countDocuments({
        classroom: student.classroom, status: 'Approved', _id: { $ne: student._id },
      });
      update.rollNumber = count + 1;
    }

    const updated = await Student.findByIdAndUpdate(id, update, { new: true });

    if (['Left', 'Rejected'].includes(status)) await syncParentStatus(student, 'inactive');
    else if (status === 'Approved')            await syncParentStatus(student, 'active');

    return r.ok(updated, `Status updated to ${status}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});
