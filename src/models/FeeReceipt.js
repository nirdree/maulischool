import mongoose from 'mongoose';

const feeReceiptSchema = new mongoose.Schema({
  receiptNo:    { type: String, required: true, unique: true },
  gatewayOrderId: { type: String, unique: true, sparse: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  items: [{
    fee:        { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
    month:      { type: Number, required: true },
    year:       { type: Number, required: true },
    amountPaid: { type: Number, required: true },
  }],
  payments:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' }],
  amountPaid:   { type: Number, required: true },
  amountRefunded: { type: Number, default: 0, min: 0 },
  refundReferences: { type: [String], default: [] },
  paymentMode:  { type: String, enum: ['Cash', 'Cheque', 'Online', 'UPI', 'BankTransfer'], required: true },
  transactionId:{ type: String },
  paymentDate:  { type: Date, required: true, default: Date.now },
  collectedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:        { type: String },
}, { timestamps: true });

export default mongoose.models.FeeReceipt || mongoose.model('FeeReceipt', feeReceiptSchema);
