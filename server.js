const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

dotenv.config();
connectDB();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
