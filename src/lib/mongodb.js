import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

let cachedSupportsTransactions = global.__mongooseSupportsTransactions;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function supportsTransactions() {
  if (typeof cachedSupportsTransactions === 'boolean') return cachedSupportsTransactions;
  await connectDB();

  try {
    const adminDb = mongoose.connection.db.admin();

    // Prefer modern command; fall back for older servers.
    let hello;
    try {
      hello = await adminDb.command({ hello: 1 });
    } catch (_) {
      hello = await adminDb.command({ isMaster: 1 });
    }

    // Transactions require a replica set member or mongos.
    cachedSupportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch (_) {
    cachedSupportsTransactions = false;
  }

  global.__mongooseSupportsTransactions = cachedSupportsTransactions;
  return cachedSupportsTransactions;
}