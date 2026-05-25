const Fee = require("../models/Fee");
const Receipt = require("../models/Receipt");
const User = require("../models/User");

// Generate unique receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `RCP/${year}/${month}/${random}`;
};

// @desc    Get student fee dashboard
// @route   GET /api/user/fees/dashboard
// @access  Private/User
const getUserFeeDashboard = async (req, res) => {
  try {
    const fees = await Fee.find({ user: req.user._id });

    const summary = {
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      pendingCount: 0,
      paidCount: 0,
      overdueCount: 0,
    };

    fees.forEach((fee) => {
      summary.totalAmount += fee.amount;
      summary.totalPaid += fee.paidAmount;
      summary.totalDue += fee.dueAmount;

      if (fee.status === "pending") summary.pendingCount++;
      if (fee.status === "paid") summary.paidCount++;
      if (fee.status === "overdue") summary.overdueCount++;
    });

    res.json({
      summary,
      fees: fees.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Pay fee
// @route   POST /api/user/fees/pay/:feeId
// @access  Private/User
const payFee = async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      transactionId,
      chequeNumber,
      bankName,
      remarks,
    } = req.body;
    const fee = await Fee.findById(req.params.feeId);

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    if (fee.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (fee.dueAmount <= 0) {
      return res.status(400).json({ message: "No due amount for this fee" });
    }

    if (amount > fee.dueAmount) {
      return res
        .status(400)
        .json({ message: `Amount cannot exceed due amount: ${fee.dueAmount}` });
    }

    // Update fee payment
    fee.paidAmount += amount;
    await fee.save();

    // Create receipt
    const receipt = await Receipt.create({
      receiptNumber: generateReceiptNumber(),
      user: req.user._id,
      fee: fee._id,
      amount: amount,
      paymentMethod,
      transactionId,
      chequeNumber,
      bankName,
      receivedBy: req.user._id,
      remarks,
    });

    res.status(201).json({
      message: "Payment successful",
      receipt,
      fee,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user receipts
// @route   GET /api/user/fees/receipts
// @access  Private/User
const getUserReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user._id })
      .populate("fee")
      .sort("-paymentDate");
    res.json(receipts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get receipt by ID
// @route   GET /api/user/fees/receipt/:id
// @access  Private/User
const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate("user", "name email studentId")
      .populate("fee");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (
      receipt.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Manager Controllers

// @desc    Create fee for student
// @route   POST /api/manager/fees
// @access  Private/Manager
const createFee = async (req, res) => {
  try {
    const {
      studentId,
      feeType,
      amount,
      dueDate,
      semester,
      academicYear,
      description,
    } = req.body;

    const user = await User.findOne({ studentId, role: "user" });
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const fee = await Fee.create({
      user: user._id,
      studentId,
      feeType,
      amount,
      paidAmount: 0,
      dueAmount: amount,
      dueDate,
      semester,
      academicYear,
      description,
    });

    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all fees (manager)
// @route   GET /api/manager/fees
// @access  Private/Manager
const getAllFees = async (req, res) => {
  try {
    const { status, semester, studentId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (semester) query.semester = semester;
    if (studentId) query.studentId = studentId;

    const fees = await Fee.find(query).populate("user", "name email");
    res.json(fees);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get fee statistics
// @route   GET /api/manager/fees/statistics
// @access  Private/Manager
const getFeeStatistics = async (req, res) => {
  try {
    const stats = await Fee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
        },
      },
    ]);

    const totalCollection = await Receipt.aggregate([
      {
        $match: { status: "valid" },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      feeStatusStats: stats,
      totalCollection: totalCollection[0] || { totalCollected: 0, count: 0 },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all receipts (manager)
// @route   GET /api/manager/fees/receipts
// @access  Private/Manager
const getAllReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate("user", "name email studentId")
      .populate("fee")
      .sort("-paymentDate");
    res.json(receipts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel receipt
// @route   PUT /api/manager/fees/receipt/:id/cancel
// @access  Private/Manager
const cancelReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (receipt.status !== "valid") {
      return res
        .status(400)
        .json({ message: "Receipt already cancelled or refunded" });
    }

    // Reverse the payment
    const fee = await Fee.findById(receipt.fee);
    fee.paidAmount -= receipt.amount;
    await fee.save();

    receipt.status = "cancelled";
    await receipt.save();

    res.json({ message: "Receipt cancelled and payment reversed", receipt });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getUserFeeDashboard,
  payFee,
  getUserReceipts,
  getReceiptById,
  createFee,
  getAllFees,
  getFeeStatistics,
  getAllReceipts,
  cancelReceipt,
};
