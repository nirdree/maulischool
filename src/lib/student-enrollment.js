import Student from '@/models/Student';

export async function getClassroomEnrollmentCounts(classroomIds) {
  if (!classroomIds.length) return {};

  const counts = await Student.aggregate([
    {
      $project: {
        enrollments: {
          $concatArrays: [
            [{
              classroom: '$classroom',
              status: '$status',
            }],
            {
              $map: {
                input: { $ifNull: ['$academicHistory', []] },
                as: 'enrollment',
                in: {
                  classroom: '$$enrollment.classroom',
                  status: '$$enrollment.status',
                },
              },
            },
          ],
        },
      },
    },
    { $unwind: '$enrollments' },
    {
      $match: {
        'enrollments.classroom': { $in: classroomIds },
        'enrollments.status': { $nin: ['Left', 'Alumni'] },
      },
    },
    { $group: { _id: '$enrollments.classroom', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(counts.map(item => [String(item._id), item.count]));
}
