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

const startDate = '2023-06-01';
const endDate = '2024-04-30';
const academicYearId = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const applyChanges = process.argv.includes('--apply');
const replaceExisting = process.argv.includes('--replace-existing');
const holidaySeed = process.argv.find(argument => argument.startsWith('--seed='))?.slice(7)
  || `${startDate}_${endDate}`;

if (academicYearId && !/^[a-f\d]{24}$/i.test(academicYearId)) {
  console.error('Usage: npm run seed:student-attendance -- [academic-year-id] [--apply] [--replace-existing] [--seed=value]');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to .env.local or .env.');
  process.exit(1);
}

const holidays = new Map([
  ['2023-06-29', 'Bakri Eid'],
  ['2023-08-15', 'Independence Day'],
  ['2023-08-16', 'Parsi New Year'],
  ['2023-09-07', 'Janmashtami'],
  ['2023-09-19', 'Ganesh Chaturthi'],
  ['2023-10-02', 'Gandhi Jayanti'],
  ['2023-10-24', 'Vijayadashami'],
  ['2023-11-14', 'Diwali holiday'],
  ['2023-11-27', 'Guru Nanak Jayanti'],
  ['2023-12-25', 'Christmas'],
  ['2024-01-26', 'Republic Day'],
  ['2024-03-08', 'Mahashivratri'],
  ['2024-03-25', 'Holi'],
  ['2024-03-29', 'Good Friday'],
  ['2024-04-09', 'Gudi Padwa'],
  ['2024-04-11', 'Eid al-Fitr'],
]);

function listDates() {
  const dates = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function seededNumber(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function addRandomWeekdayHolidays(dates) {
  const candidatesByMonth = new Map();
  for (const date of dates) {
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    if (weekday === 0 || weekday === 6 || holidays.has(date)) continue;
    const month = date.slice(0, 7);
    if (!candidatesByMonth.has(month)) candidatesByMonth.set(month, []);
    candidatesByMonth.get(month).push(date);
  }

  for (const [month, candidates] of candidatesByMonth) {
    const chosenDate = candidates[Math.floor(seededNumber(`${holidaySeed}:${month}`) * candidates.length)];
    holidays.set(chosenDate, `Additional school holiday (${month})`);
  }
}

function attendanceFor(studentId, date, weekday) {
  const holidayName = holidays.get(date);
  if (holidayName) return { status: 'Holiday', remark: holidayName };
  if (weekday === 0) return { status: 'Holiday', remark: 'Sunday' };
  if (weekday === 6) return { status: 'Holiday', remark: 'Saturday' };

  const sample = seededNumber(`${holidaySeed}:${studentId}:${date}`);
  if (sample < 0.8) return { status: 'Present', remark: '' };
  if (sample < 0.88) return { status: 'Absent', remark: 'Did not attend school' };
  if (sample < 0.94) return { status: 'Late', remark: 'Arrived late' };
  return { status: 'HalfDay', remark: 'Attended half day' };
}

async function seedAttendance() {
  const { connectDB } = await import('../src/lib/mongodb.js');
  const Student = (await import('../src/models/Student.js')).default;
  const { Attendance } = await import('../src/models/Attendance.js');
  const AcademicYear = (await import('../src/models/Academicyear.js')).default;
  const mongoose = (await import('mongoose')).default;

  try {
    await connectDB();
    const academicYear = academicYearId
      ? await AcademicYear.findById(academicYearId).select('_id name')
      : await AcademicYear.findOne({ name: '2023-2024' }).select('_id name');
    if (!academicYear) {
      const target = academicYearId ? `Academic year ${academicYearId}` : 'Academic year 2023-2024';
      throw new Error(`${target} was not found`);
    }

    const dates = listDates();
    addRandomWeekdayHolidays(dates);
    const academicYearObjectId = new mongoose.Types.ObjectId(String(academicYear._id));
    const students = await Student.find({
      academicYear: academicYearObjectId,
      status: 'Approved',
      classroom: { $ne: null },
    }).select('_id classroom firstName lastName');

    const operations = [];
    const statusCounts = {
      Present: 0,
      Absent: 0,
      Late: 0,
      HalfDay: 0,
      Holiday: 0,
    };

    for (const student of students) {
      for (const date of dates) {
        const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
        const attendance = attendanceFor(String(student._id), date, weekday);
        statusCounts[attendance.status] += 1;
        const attendanceDate = new Date(`${date}T00:00:00.000Z`);
        const values = {
          student: student._id,
          classroom: student.classroom,
          date: attendanceDate,
          status: attendance.status,
          remark: attendance.remark,
          academicYear: academicYearObjectId,
        };

        operations.push({
          updateOne: {
            filter: { student: student._id, date: attendanceDate },
            update: {
              [replaceExisting ? '$set' : '$setOnInsert']: values,
            },
            upsert: true,
          },
        });
      }
    }

    console.log(`Academic year: ${academicYear.name} (${academicYear._id})`);
    console.log(`Date range: ${startDate} through ${endDate}`);
    console.log(`Approved students found: ${students.length}`);
    console.log(`Attendance records to process: ${operations.length}`);
    console.log('Generated status counts:', statusCounts);
    console.log('Additional weekday holidays:', [...holidays.entries()]
      .filter(([, name]) => name.startsWith('Additional school holiday'))
      .map(([date]) => date)
      .join(', '));

    if (!applyChanges) {
      console.log('Dry run only. Add --apply to write attendance records.');
      if (!replaceExisting) {
        console.log('Existing records will be preserved. Add --replace-existing with --apply to overwrite them.');
      }
      return;
    }

    let inserted = 0;
    let modified = 0;
    for (let index = 0; index < operations.length; index += 500) {
      const result = await Attendance.bulkWrite(operations.slice(index, index + 500), {
        ordered: false,
      });
      inserted += result.upsertedCount;
      modified += result.modifiedCount;
    }

    console.log(`Inserted ${inserted} records; modified ${modified} existing records.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedAttendance().catch(error => {
  console.error('Failed to seed student attendance:', error);
  process.exitCode = 1;
});
