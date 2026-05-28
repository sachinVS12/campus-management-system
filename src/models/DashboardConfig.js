const mongoose = require("mongoose");

const dashboardConfigSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  layout: {
    widgets: [
      {
        widgetId: String,
        type: String,
        title: String,
        position: {
          x: Number,
          y: Number,
          w: Number,
          h: Number,
        },
        isVisible: { type: Boolean, default: true },
        refreshInterval: { type: Number, default: 30000 },
        settings: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  theme: {
    primaryColor: { type: String, default: "#3B82F6" },
    secondaryColor: { type: String, default: "#10B981" },
    darkMode: { type: Boolean, default: false },
  },
  preferences: {
    defaultView: { type: String, default: "grid" },
    showNotifications: { type: Boolean, default: true },
    autoRefresh: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model("DashboardConfig", dashboardConfigSchema);
