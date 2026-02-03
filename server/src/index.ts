import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRouter from "./routes/search";
import streamRouter from "./routes/stream";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/api/search", searchRouter);
app.use("/api/stream", streamRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
