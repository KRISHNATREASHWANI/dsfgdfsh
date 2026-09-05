/**
 * File Manager — Node/Express backend
 * -------------------------------------
 * Exposes create/read/update/delete operations over a small REST API.
 * All operations are sandboxed to the ./storage directory so the app
 * never touches files anywhere else on disk, and filenames are
 * validated to block path traversal (e.g. "../../etc/passwd").
 */

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = path.join(__dirname, "storage");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Make sure the sandbox directory exists on startup.
fs.mkdir(STORAGE_DIR, { recursive: true }).catch(() => {});

// --- helpers ----------------------------------------------------------

function isSafeName(name) {
  if (typeof name !== "string" || !name.trim()) return false;
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return false;
  return true;
}

function resolveSafe(name) {
  return path.join(STORAGE_DIR, name);
}

// --- routes -------------------------------------------------------------

// List files (used to populate a quick directory view if needed later)
app.get("/api/files", async (req, res) => {
  const entries = await fs.readdir(STORAGE_DIR).catch(() => []);
  res.json({ files: entries });
});

// Create
app.post("/api/files", async (req, res) => {
  const { name, content = "" } = req.body;
  if (!isSafeName(name)) {
    return res.status(400).json({ ok: false, message: "Enter a valid file name." });
  }
  const filePath = resolveSafe(name);
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  if (exists) {
    return res.json({ ok: false, message: `"${name}" already exists.` });
  }
  await fs.writeFile(filePath, content, "utf-8");
  res.json({ ok: true, message: `"${name}" created successfully.` });
});

// Read
app.get("/api/files/:name", async (req, res) => {
  const { name } = req.params;
  if (!isSafeName(name)) {
    return res.status(400).json({ ok: false, message: "Enter a valid file name." });
  }
  const filePath = resolveSafe(name);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    res.json({ ok: true, message: "Loaded.", content });
  } catch {
    res.json({ ok: false, message: `"${name}" does not exist.` });
  }
});

// Update — rename / append / overwrite
app.patch("/api/files/:name", async (req, res) => {
  const { name } = req.params;
  const { mode, value = "" } = req.body;
  if (!isSafeName(name)) {
    return res.status(400).json({ ok: false, message: "Enter a valid file name." });
  }
  const filePath = resolveSafe(name);
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  if (!exists) {
    return res.json({ ok: false, message: `"${name}" does not exist.` });
  }

  if (mode === "rename") {
    if (!isSafeName(value)) {
      return res.status(400).json({ ok: false, message: "Enter a valid new name." });
    }
    const newPath = resolveSafe(value);
    const newExists = await fs.access(newPath).then(() => true).catch(() => false);
    if (newExists) {
      return res.json({ ok: false, message: `"${value}" already exists.` });
    }
    await fs.rename(filePath, newPath);
    return res.json({ ok: true, message: `Renamed "${name}" to "${value}".` });
  }

  if (mode === "append") {
    await fs.appendFile(filePath, "\n" + value, "utf-8");
    return res.json({ ok: true, message: `Content appended to "${name}".` });
  }

  if (mode === "overwrite") {
    await fs.writeFile(filePath, value, "utf-8");
    return res.json({ ok: true, message: `"${name}" overwritten successfully.` });
  }

  res.status(400).json({ ok: false, message: "Unknown update mode." });
});

// Delete
app.delete("/api/files/:name", async (req, res) => {
  const { name } = req.params;
  if (!isSafeName(name)) {
    return res.status(400).json({ ok: false, message: "Enter a valid file name." });
  }
  const filePath = resolveSafe(name);
  try {
    await fs.unlink(filePath);
    res.json({ ok: true, message: `"${name}" deleted successfully.` });
  } catch {
    res.json({ ok: false, message: `"${name}" does not exist.` });
  }
});

app.listen(PORT, () => {
  console.log(`File Manager running at http://localhost:${PORT}`);
});
