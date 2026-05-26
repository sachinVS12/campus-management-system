const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fee",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "bank_transfer", "online", "cheque"],
    required: true,
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  chequeNumber: String,
  bankName: String,
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  remarks: String,
  status: {
    type: String,
    enum: ["valid", "cancelled", "refunded"],
    default: "valid",
  },
});

module.exports = mongoose.model("Receipt", receiptSchema);
