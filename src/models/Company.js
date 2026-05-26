const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  industry: {
    type: String,
    required: true,
  },
  website: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },
  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String,
  },
  description: String,
  status: {
    type: String,
    enum: ["active", "inactive", "blacklisted"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Company", companySchema);
