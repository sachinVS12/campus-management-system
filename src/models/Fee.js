const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  feeType: {
    type: String,
    enum: [
      "tuition",
      "library",
      "hostel",
      "transport",
      "exam",
      "lab",
      "sports",
      "other",
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  dueAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  description: String,
  lateFee: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update due amount when paid amount changes
feeSchema.pre("save", function (next) {
  this.dueAmount = this.amount - this.paidAmount;
  if (this.dueAmount === 0) {
    this.status = "paid";
  } else if (this.paidAmount > 0 && this.dueAmount > 0) {
    this.status = "partial";
  } else if (new Date() > this.dueDate && this.dueAmount > 0) {
    this.status = "overdue";
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
