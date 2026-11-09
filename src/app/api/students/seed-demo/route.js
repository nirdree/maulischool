import { randomBytes } from 'node:crypto';
import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

const STUDENTS_PER_CLASS = 10;
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Advait', 'Anaya', 'Arjun',
  'Diya', 'Ishaan', 'Kavya', 'Neel', 'Riya',
];
const LAST_NAMES = [
  'Patil', 'Shinde', 'Deshmukh', 'Jadhav', 'Kulkarni',
  'Joshi', 'Pawar', 'More', 'Kadam', 'Chavan',
  'Bhosale', 'Gaikwad', 'Sawant', 'Mane', 'Salunkhe',
  'Thorat', 'Naik', 'Lokhande', 'Dhumal', 'Gore',
];
const FATHER_NAMES = ['Anil', 'Mahesh', 'Sanjay', 'Rajesh', 'Vijay', 'Sunil'];
const MOTHER_NAMES = ['Sunita', 'Meena', 'Savita', 'Pooja', 'Rekha', 'Kavita'];

function makeParentPassword() {
  return randomBytes(15).toString('base64url');
}

function makeBirthDate(classIndex, studentIndex, academicYearStart) {
  const age = 5 + (classIndex % 10);
  const schoolYear = new Date(academicYearStart).getUTCFullYear();
  return new Date(Date.UTC(schoolYear - age, studentIndex % 12, 1 + (studentIndex % 27)));
}

function phoneForFamily(familyKey, role) {
  let hash = 0;
  for (const character of familyKey) {
    hash = (hash * 31 + character.charCodeAt(0)) % 10000000;
  }
  const prefix = role === 'father' ? '900' : '910';
  return `${prefix}${String(hash).padStart(7, '0')}`;
}

export const POST = authorize('admin')(async () => {
  const createdStudentIds = [];
  const createdUserIds = [];
  const linkedUserIds = new Set();
  const generatedParentAccounts = [];

  try {
    await connectDB();
    const academicYear = await AcademicYear.findOne({ isCurrent: true });
    if (!academicYear) return r.badRequest('There is no current academic year');

    const classrooms = await Classroom.find({
      academicYear: academicYear._id,
      isActive: true,
    }).sort({ order: 1, className: 1, section: 1 });
    if (!classrooms.length) return r.badRequest('No active classrooms found for the current academic year');

    const classroomIds = classrooms.map(classroom => classroom._id);
    const [existingCounts, existingRollNumbers] = await Promise.all([
      Student.aggregate([
        {
          $match: {
            academicYear: academicYear._id,
            classroom: { $in: classroomIds },
            status: { $nin: ['Left', 'Alumni'] },
          },
        },
        { $group: { _id: '$classroom', count: { $sum: 1 } } },
      ]),
      Student.aggregate([
        { $match: { classroom: { $in: classroomIds } } },
        { $group: { _id: '$classroom', maxRollNumber: { $max: '$rollNumber' } } },
      ]),
    ]);

    const countByClassroom = new Map(
      existingCounts.map(item => [String(item._id), item.count]),
    );
    const rollByClassroom = new Map(
      existingRollNumbers.map(item => [String(item._id), item.maxRollNumber || 0]),
    );
    const classResults = [];

    async function getParentUser(familyKey, role, name, studentName) {
      const email = `demo.${role}.${familyKey}@example.test`;
      const existing = await User.findOne({ email });
      if (existing) {
        if (existing.role !== 'parent') {
          throw new Error(`Demo parent email ${email} is already used by a non-parent account`);
        }
        return existing;
      }

      const password = makeParentPassword();
      const user = await User.create({
        name,
        email,
        password,
        role: 'parent',
        status: 'active',
        studentIds: [],
      });
      createdUserIds.push(user._id);
      generatedParentAccounts.push({
        name,
        email,
        password,
        siblingGroup: familyKey,
        firstStudent: studentName,
      });
      return user;
    }

    for (let classIndex = 0; classIndex < classrooms.length; classIndex += 1) {
      const classroom = classrooms[classIndex];
      const classroomId = String(classroom._id);
      const currentCount = countByClassroom.get(classroomId) || 0;
      const toCreate = Math.max(0, STUDENTS_PER_CLASS - currentCount);
      let nextRollNumber = rollByClassroom.get(classroomId) || 0;

      for (let studentIndex = currentCount; studentIndex < STUDENTS_PER_CLASS; studentIndex += 1) {
        const firstName = FIRST_NAMES[(classIndex * 3 + studentIndex) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(classIndex * 7 + studentIndex * 3) % LAST_NAMES.length];
        const studentName = `${firstName} ${lastName}`;
        const fatherName = FATHER_NAMES[(classIndex + studentIndex) % FATHER_NAMES.length];
        const motherName = MOTHER_NAMES[(classIndex * 2 + studentIndex) % MOTHER_NAMES.length];
        const familyKey = studentIndex === 0
          ? `siblings-${Math.floor(classIndex / 2) + 1}`
          : `class-${classIndex + 1}-student-${studentIndex + 1}`;

        const fatherUser = await getParentUser(
          familyKey,
          'father',
          `${fatherName} ${lastName}`,
          studentName,
        );
        const motherUser = await getParentUser(
          familyKey,
          'mother',
          `${motherName} ${lastName}`,
          studentName,
        );

        nextRollNumber += 1;
        const student = await Student.create({
          firstName,
          lastName,
          gender: studentIndex % 2 === 0 ? 'Male' : 'Female',
          dateOfBirth: makeBirthDate(classIndex, studentIndex, academicYear.startDate),
          classroom: classroom._id,
          academicYear: academicYear._id,
          rollNumber: nextRollNumber,
          status: 'Approved',
          fatherName: fatherUser.name,
          fatherPhone: phoneForFamily(familyKey, 'father'),
          fatherEmail: fatherUser.email,
          fatherOccupation: 'Service',
          motherName: motherUser.name,
          motherPhone: phoneForFamily(familyKey, 'mother'),
          motherEmail: motherUser.email,
          motherOccupation: 'Homemaker',
          fatherUser: fatherUser._id,
          motherUser: motherUser._id,
        });
        createdStudentIds.push(student._id);

        linkedUserIds.add(String(fatherUser._id));
        linkedUserIds.add(String(motherUser._id));
        const [fatherLink, motherLink] = await Promise.all([
          User.updateOne({ _id: fatherUser._id }, { $addToSet: { studentIds: student._id } }),
          User.updateOne({ _id: motherUser._id }, { $addToSet: { studentIds: student._id } }),
        ]);
        if (!fatherLink.matchedCount || !motherLink.matchedCount) {
          throw new Error(`Could not link parent accounts for ${studentName}`);
        }
      }

      classResults.push({
        classroom: classroom.displayName,
        existingStudents: currentCount,
        createdStudents: toCreate,
        finalStudentCount: currentCount + toCreate,
      });
    }

    return r.created({
      academicYear: academicYear.name,
      classrooms: classResults,
      totalCreated: createdStudentIds.length,
      parentAccounts: generatedParentAccounts,
    }, `Added ${createdStudentIds.length} demo student(s); each active class now has at least ${STUDENTS_PER_CLASS} students.`);
  } catch (error) {
    const studentIds = createdStudentIds;
    const cleanupResults = await Promise.allSettled([
      studentIds.length ? Student.deleteMany({ _id: { $in: studentIds } }) : Promise.resolve(),
      linkedUserIds.size
        ? User.updateMany(
            { _id: { $in: [...linkedUserIds] } },
            { $pull: { studentIds: { $in: studentIds } } },
          )
        : Promise.resolve(),
      createdUserIds.length ? User.deleteMany({ _id: { $in: createdUserIds } }) : Promise.resolve(),
    ]);
    const cleanupErrors = cleanupResults
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);
    if (cleanupErrors.length) {
      console.error('Demo student seed cleanup failed:', cleanupErrors);
    }

    console.error('Demo student seeding failed:', error);
    return r.serverError(error.message);
  }
});