import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

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

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/courses", courseRoutes);

app.get("/debug/routes", (req, res) => {
  const routes = [];

  app._router.stack.forEach((layer) => {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
      routes.push(`${methods} ${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      layer.handle.stack.forEach((h) => {
        if (h.route?.path) {
          const methods = Object.keys(h.route.methods).join(",").toUpperCase();
          routes.push(`${methods} ${h.route.path}`);
        }
      });
    }
  });

  res.json({ routes: routes.sort() });
});

app.get("/health", (req, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3001, () =>
      console.log("MongoDB connected, Server running at: " + process.env.PORT),
    );
  })
  .catch((err) => console.error(err));
