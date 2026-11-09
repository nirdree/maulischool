import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;

    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

loadEnv();

const academicYearArg = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const applyChanges = process.argv.includes('--apply');
const seed = process.argv.find(argument => argument.startsWith('--seed='))?.slice(7)
  || 'demo-student-marks-2023-2024';

if (academicYearArg && !/^[a-f\d]{24}$/i.test(academicYearArg)) {
  console.error('Usage: npm run seed:student-marks -- [academic-year-id] [--apply] [--seed=value]');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to .env.local or .env.');
  process.exit(1);
}

function seededNumber(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function gradeFor(marksObtained, totalMarks) {
  const percentage = (marksObtained / totalMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

async function seedMarks() {
  const { connectDB } = await import('../src/lib/mongodb.js');
  const AcademicYear = (await import('../src/models/Academicyear.js')).default;
  const Classroom = (await import('../src/models/Classroom.js')).default;
  const Subject = (await import('../src/models/Subject.js')).default;
  const Student = (await import('../src/models/Student.js')).default;
  const { Exam, Marks } = await import('../src/models/Exam.js');
  const mongoose = (await import('mongoose')).default;

  try {
    await connectDB();
    const academicYear = academicYearArg
      ? await AcademicYear.findById(academicYearArg).select('_id name')
      : await AcademicYear.findOne({ name: '2023-2024' }).select('_id name');
    if (!academicYear) {
      const target = academicYearArg
        ? `Academic year ${academicYearArg}`
        : 'Academic year 2023-2024';
      throw new Error(`${target} was not found`);
    }

    const classroomIds = (await Classroom.find({
      academicYear: academicYear._id,
      isActive: true,
    }).distinct('_id'));
    if (!classroomIds.length) throw new Error('No active classrooms found');

    const academicYearId = new mongoose.Types.ObjectId(String(academicYear._id));
    const subjects = await Subject.find({
      academicYear: academicYearId,
      classroom: { $in: classroomIds },
      isActive: true,
    }).select('_id name classroom totalMarks');
    if (!subjects.length) throw new Error('No active subjects found');

    const subjectIds = subjects.map(subject => subject._id);
    const [students, exams] = await Promise.all([
      Student.find({
        academicYear: academicYearId,
        classroom: { $in: classroomIds },
        status: 'Approved',
      }).select('_id classroom firstName lastName'),
      Exam.find({
        academicYear: academicYearId,
        classroom: { $in: classroomIds },
        subject: { $in: subjectIds },
      }).select('_id name examType subject classroom totalMarks'),
    ]);

    const examsBySubject = new Map();
    for (const exam of exams) {
      const key = String(exam.subject);
      if (!examsBySubject.has(key)) examsBySubject.set(key, []);
      examsBySubject.get(key).push(exam);
    }

    const incompleteSubjects = subjects.filter(subject =>
      (examsBySubject.get(String(subject._id)) || []).length !== 4,
    );
    if (incompleteSubjects.length) {
      throw new Error(
        `Expected exactly 4 exams for each active subject; found a different count for: ${incompleteSubjects.map(subject => subject.name).join(', ')}`,
      );
    }

    const studentsByClass = new Map();
    for (const student of students) {
      const key = String(student.classroom);
      if (!studentsByClass.has(key)) studentsByClass.set(key, []);
      studentsByClass.get(key).push(student);
    }

    const operations = [];
    let minimumScore = Infinity;
    let maximumScore = 0;
    let maximumExamTotal = 0;
    for (const subject of subjects) {
      const subjectExams = examsBySubject.get(String(subject._id)) || [];
      for (const exam of subjectExams) {
        if (!Number.isFinite(exam.totalMarks) || exam.totalMarks < 1) {
          throw new Error(`Exam "${exam.name}" has an invalid maximum mark`);
        }
        maximumExamTotal = Math.max(maximumExamTotal, exam.totalMarks);
        if (String(exam.classroom) !== String(subject.classroom)) {
          throw new Error(`Exam "${exam.name}" is assigned to a different class than its subject`);
        }

        const classStudents = studentsByClass.get(String(exam.classroom)) || [];
        for (const student of classStudents) {
          const ratio = 0.55 + seededNumber(`${seed}:${exam._id}:${student._id}`) * 0.45;
          const marksObtained = Math.min(exam.totalMarks, Math.floor(ratio * exam.totalMarks));
          minimumScore = Math.min(minimumScore, marksObtained);
          maximumScore = Math.max(maximumScore, marksObtained);
          operations.push({
            updateOne: {
              filter: { exam: exam._id, student: student._id },
              update: {
                $setOnInsert: {
                  exam: exam._id,
                  student: student._id,
                  subject: subject._id,
                  classroom: exam.classroom,
                  marksObtained,
                  isAbsent: false,
                  grade: gradeFor(marksObtained, exam.totalMarks),
                  remarks: '',
                  academicYear: academicYearId,
                },
              },
              upsert: true,
            },
          });
        }
      }
    }

    console.log(`Academic year: ${academicYear.name} (${academicYear._id})`);
    console.log(`Active classrooms: ${classroomIds.length}`);
    console.log(`Active subjects: ${subjects.length}`);
    console.log(`Approved students: ${students.length}`);
    console.log(`Exams: ${exams.length}`);
    console.log(`Student mark records to process: ${operations.length}`);
    console.log(`Generated marks range: ${Number.isFinite(minimumScore) ? minimumScore : 0}–${maximumScore}`);
    console.log(`Maximum exam total: ${maximumExamTotal}`);

    if (!applyChanges) {
      console.log('Dry run only. Add --apply to write marks. Existing marks will be preserved.');
      return;
    }

    let inserted = 0;
    for (let index = 0; index < operations.length; index += 500) {
      const result = await Marks.bulkWrite(operations.slice(index, index + 500), {
        ordered: false,
      });
      inserted += result.upsertedCount;
    }
    console.log(`Inserted ${inserted} student mark record(s); existing records were preserved.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedMarks().catch(error => {
  console.error('Failed to seed student marks:', error);
  process.exitCode = 1;
});
