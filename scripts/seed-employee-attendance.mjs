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
const academicYearId = process.argv[2];
const applyChanges = process.argv.includes('--apply');
const replaceExisting = process.argv.includes('--replace-existing');
const holidaySeed = process.argv.find(argument => argument.startsWith('--seed='))?.slice(7)
  || `${startDate}_${endDate}`;

if (!academicYearId || !/^[a-f\d]{24}$/i.test(academicYearId)) {
  console.error('Usage: npm run seed:employee-attendance -- <academic-year-id> [--apply] [--replace-existing] [--seed=value]');
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

function dateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid employee joining date: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

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

function attendanceFor(employeeId, date, weekday) {
  const holidayName = holidays.get(date);
  if (holidayName) return { status: 'Holiday', remark: holidayName };
  if (weekday === 0) return { status: 'Holiday', remark: 'Sunday' };
  if (weekday === 6) return { status: 'Holiday', remark: 'Saturday' };

  const sample = seededNumber(`${holidaySeed}:${employeeId}:${date}`);
  if (sample < 0.82) return { status: 'Present', remark: '' };
  if (sample < 0.88) return { status: 'Absent', remark: 'Did not attend school' };
  if (sample < 0.93) return { status: 'Late', remark: 'Arrived late' };
  if (sample < 0.96) return { status: 'HalfDay', remark: 'Attended half day' };
  return { status: 'OnLeave', remark: 'On leave' };
}

async function seedAttendance() {
  const { connectDB } = await import('../src/lib/mongodb.js');
  const Employee = (await import('../src/models/Employee.js')).default;
  const { EmployeeAttendance } = await import('../src/models/Attendance.js');
  const AcademicYear = (await import('../src/models/Academicyear.js')).default;
  const mongoose = (await import('mongoose')).default;

  try {
    await connectDB();
    const academicYear = await AcademicYear.findById(academicYearId).select('_id');
    if (!academicYear) throw new Error(`Academic year ${academicYearId} was not found`);

    const dates = listDates();
    addRandomWeekdayHolidays(dates);
    const academicYearObjectId = new mongoose.Types.ObjectId(academicYearId);

    const employees = await Employee.find({
      dateOfJoining: { $lte: new Date(`${endDate}T23:59:59.999Z`) },
    }).select('_id name dateOfJoining');

    const operations = [];
    const statusCounts = {
      Present: 0,
      Absent: 0,
      Late: 0,
      HalfDay: 0,
      OnLeave: 0,
      Holiday: 0,
    };

    for (const employee of employees) {
      const joiningDate = dateOnly(employee.dateOfJoining);
      for (const date of dates) {
        if (date < joiningDate) continue;

        const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
        const attendance = attendanceFor(String(employee._id), date, weekday);
        statusCounts[attendance.status] += 1;
        const attendanceDate = new Date(`${date}T00:00:00.000Z`);
        const values = {
          employee: employee._id,
          date: attendanceDate,
          status: attendance.status,
          remark: attendance.remark,
          academicYear: academicYearObjectId,
        };

        operations.push({
          updateOne: {
            filter: { employee: employee._id, date: attendanceDate },
            update: {
              [replaceExisting ? '$set' : '$setOnInsert']: values,
            },
            upsert: true,
          },
        });
      }
    }

    console.log(`Date range: ${startDate} through ${endDate}`);
    console.log(`Employees found: ${employees.length}`);
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
      const result = await EmployeeAttendance.bulkWrite(operations.slice(index, index + 500), {
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
  console.error('Failed to seed employee attendance:', error);
  process.exitCode = 1;
});
