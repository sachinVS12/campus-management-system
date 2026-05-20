const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const couresSchema = new mongoose.Schema({
  coursename: {
    type: String,
    required: true,
  },
  couresfee: {
    type: String,
    required: true,
  },
  couresduration: {
    type: Number,
    requird: true,
  },
});

// create model
const course = mongoose.model("course", couresSchema);

// exports module
module.exports = module;
