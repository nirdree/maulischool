import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

loadEnv();

const { connectDB } = await import('../src/lib/mongodb.js');
const User = (await import('../src/models/User.js')).default;

async function createAdmin() {
  try {
    await connectDB();

    const email = 'admin@school.com';
    const password = 'Admin@123';

    let adminUser = await User.findOne({ email });

    if (!adminUser) {
      adminUser = new User({
        name: 'Admin',
        email,
        password,
        role: 'admin',
        status: 'active',
      });
    } else {
      adminUser.name = 'Admin';
      adminUser.role = 'admin';
      adminUser.status = 'active';
      adminUser.password = password;
    }

    await adminUser.save();
    console.log(`Admin user ready: ${email}`);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin();
