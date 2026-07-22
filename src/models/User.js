import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['admin', 'principal', 'teacher', 'parent'], required: true },
  status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.email) this.email = this.email.toLowerCase().trim();

  if (!this.isModified('password')) return next();
  if (typeof this.password === 'string' && this.password.startsWith('$2')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('insertMany', async function (next, docs) {
  for (const doc of docs) {
    if (doc.email) doc.email = doc.email.toLowerCase().trim();
    if (doc.password && typeof doc.password === 'string' && !doc.password.startsWith('$2')) {
      doc.password = await bcrypt.hash(doc.password, 12);
    }
  }
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;

  if (this.password.startsWith('$2')) {
    return bcrypt.compare(entered, this.password);
  }

  if (this.password === entered) {
    this.password = await bcrypt.hash(entered, 12);
    await this.save();
    return true;
  }

  return false;
};

export default mongoose.models.User || mongoose.model('User', userSchema);