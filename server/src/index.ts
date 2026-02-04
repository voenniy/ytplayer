import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import searchRouter from "./routes/search";
import streamRouter from "./routes/stream";
import { initDb } from "./db";
import playlistsRouter from "./routes/playlists";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use("/api/search", searchRouter);
app.use("/api/stream", streamRouter);
app.use("/api/playlists", playlistsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve client static files in production
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
