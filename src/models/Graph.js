const mongoose = require("mongoose");

const graphSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["bar", "line", "pie", "doughnut", "radar", "polarArea"],
    required: true,
  },
  data: {
    labels: [String],
    datasets: [
      {
        label: String,
        data: [Number],
        backgroundColor: [String],
        borderColor: [String],
        borderWidth: Number,
        fill: Boolean,
      },
    ],
  },
  options: {
    responsive: { type: Boolean, default: true },
    maintainAspectRatio: { type: Boolean, default: true },
    plugins: {
      legend: { type: Object, default: { position: "top" } },
      title: { type: Object },
    },
  },
  category: {
    type: String,
    enum: [
      "academic",
      "fees",
      "placement",
      "attendance",
      "performance",
      "custom",
    ],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userRole: {
    type: String,
    enum: ["user", "manager"],
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  filePath: String,
  fileFormat: {
    type: String,
    enum: ["png", "jpg", "pdf", "csv", "excel"],
    default: "png",
  },
  filters: {
    semester: Number,
    department: String,
    academicYear: String,
    dateRange: {
      start: Date,
      end: Date,
    },
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

graphSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Graph", graphSchema);
