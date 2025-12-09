import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import contactRoutes from "./routes/contact.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ["POST"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", contactRoutes);

app.get("/", (req, res) => {
  return res.status(200).json({success:true,message:"Telegram Contact Bot API is Running 🚀"});
});

app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
