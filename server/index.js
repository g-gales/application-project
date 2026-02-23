import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/courses", courseRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3001, () =>
      console.log("MongoDB connected, Server running at: " + process.env.PORT),
    );
  })
  .catch((err) => console.error(err));
