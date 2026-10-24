import mongoose from 'mongoose';

const cashfreePaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fee: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  feePayment: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' },
  expectedAmount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'INR', required: true },
  gateway: { type: String, enum: ['Cashfree'], default: 'Cashfree', required: true },
  orderId: { type: String, unique: true, sparse: true },
  paymentSessionId: { type: String, select: false },
  cashfreePaymentId: { type: String },
  transactionReference: { type: String },
  paymentMethod: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
    required: true,
  },
  activeFeeKey: { type: String, unique: true, sparse: true },
  failureReason: { type: String },
  paidAt: { type: Date },
  refundedAt: { type: Date },
  refundAmount: { type: Number, default: 0, min: 0 },
  refundReference: { type: String },
  receiptNo: { type: String },
  webhookEvents: { type: [String], default: [] },
}, { timestamps: true });

cashfreePaymentSchema.index({ parent: 1, createdAt: -1 });
cashfreePaymentSchema.index({ student: 1, fee: 1, status: 1 });

export default mongoose.models.CashfreePayment
  || mongoose.model('CashfreePayment', cashfreePaymentSchema);
