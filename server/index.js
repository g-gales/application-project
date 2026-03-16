import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import pingDbRoute from "./routes/pingDbRoute.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import wellnessRoutes from "./routes/wellnessRoutes.js";

dotenv.config();

const app = express();

const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_ORIGIN];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/v1/ping-db", pingDbRoute);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/wellness", wellnessRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

const port = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () =>
      console.log("MongoDB connected, Server running at: " + port),
    );
  })
  .catch((err) => console.error(err));
