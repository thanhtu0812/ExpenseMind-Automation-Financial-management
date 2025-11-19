require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { router: reportRoutes } = require("./routes/reportRoutes");
const { startScheduler } = require("./scheduler");

require("./services/reminderService");

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use("/icons", express.static(path.join(__dirname, "public/icons")));

app.get("/api/icons", (req, res) => {
  const iconsDirectory = path.join(__dirname, "public/icons");

  fs.readdir(iconsDirectory, (err, files) => {
    if (err) {
      console.error("Không thể đọc thư mục icons:", err);
      return res.status(500).json({ message: "Lỗi server khi lấy icons!" });
    }

    const iconUrls = files
      .filter(
        (file) =>
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".svg")
      )
      .map((file) => `/icons/${file}`);

    res.json(iconUrls);
  });
});
app.use("/api/reports", reportRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/reminders", require("./routes/reminderRoutes"));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
    startScheduler();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
