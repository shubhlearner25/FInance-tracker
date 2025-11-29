const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const axios = require('axios');
const cron = require('node-cron');
require('./cron');

// import sanitizeMiddleware
const { sanitizeMiddleware } = require("./middleware/sanitizeMiddleware");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ====== FIXED CORS CONFIG ======
const allowedOrigins = [
  "http://localhost:5173",
  "https://paisable.netlify.app",
  "https://f-inance-tracker-5h3f.vercel.app"   // ✅ Your Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight OPTIONS
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(sanitizeMiddleware());

// ====== ROUTES ======
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/recurring', require('./routes/recurringTransactionRoutes'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get("/", (req, res) => {
  res.send("API is Running");
});

// No wildcard routes here!! ❌ app.get('*')

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);


// ====== KEEP ALIVE CRON JOB (Render) ======
cron.schedule("*/10 * * * *", async () => {
  const keepAliveUrl = process.env.KEEP_ALIVE_URL;
  if (!keepAliveUrl) {
    console.error("KEEP_ALIVE_URL env variable missing.");
    return;
  }

  try {
    await axios.get(keepAliveUrl);
    console.log("Keep-alive ping sent!");
  } catch (error) {
    console.error("Keep-alive FAILED!", error.message);
  }
});

module.exports = { app, server };
