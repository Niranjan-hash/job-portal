require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(col.name));

    if (collections.some(c => c.name === "jobdetails")) {
      const count = await db.collection("jobdetails").countDocuments();
      console.log("📊 jobdetails count:", count);
    }
  })
  .catch(err => console.error("❌ MongoDB Error:", err.message));

// Routes
const authRoutes = require("./routes/authroutes");
const jobRouter = require("./routes/JobPost");
const searchRouter = require("./routes/search");

app.use("/search", searchRouter);   // ✅ FIXED
app.use("/user", authRoutes);
app.use("/api/jobs", jobRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
