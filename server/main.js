#! /usr/bin/env node

const { execSync, exec } = require("child_process");
const simpleGit = require("simple-git");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);

// Check if Git is installed
try {
  execSync("git --version", { stdio: "ignore" });
} catch (error) {
  console.error("Git is not installed. Please install Git and try again.");
  process.exit(1);
}

// Check if the current working directory is a Git repository
const git = simpleGit(process.cwd());
git
  .checkIsRepo()
  .then((isRepo) => {
    if (!isRepo) {
      console.error("The current working directory is not a Git repository.");
      process.exit(1);
    } else {
      startServer();
    }
  })
  .catch((error) => {
    console.error("Error checking Git repository:", error);
    process.exit(1);
  });

function startServer() {
  const app = express();
  // TODO: don't do this prod
  app.use(cors());
  const port = 3000;

  const clientDistPath = path.join(__dirname, "../client/dist");
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
  } else {
    console.warn(`Static files directory not found: ${clientDistPath}`);
  }

  // POST endpoint to return a list of changed files
  app.post("/diff", async (req, res) => {
    try {
      const status = await git.status();
      res.json({ files: status.files });
    } catch (error) {
      console.error("Error getting changed files:", error);
      res.status(500).json({ error: "Error getting changed files" });
    }
  });

  app.post("/file", async (req, res) => {
    try {
      const path = req.query.path;
      const diff = await git.diff(["HEAD", path]);
      console.log("diff", diff);
      // const [newBuffer, oldBuffer] = await Promise.all([
      //   readFileAsync(path)
      //     .then((data) => data.toString())
      //     .catch((err) => {
      //       console.error("err reading file", err);
      //       return "";
      //     }),
      //   git.show(`HEAD:${path}`).catch((err) => {
      //     console.error("err git show", err);
      //     return "";
      //   }),
      // ]);
      res.json({
        diff,
      });
    } catch (error) {
      console.log("file diff error", error);
      res.status(500).json({});
    }
  });

  app.post("/open", async (req, res) => {
    try {
      const filePath = req.query.path;
      const fullPath = path.resolve(process.cwd(), filePath);
      console.log("full", fullPath);
      await execAsync(`code ${fullPath}`);
      res.json({});
    } catch (error) {
      console.log("error open", path, error);
      res.status(500).json({});
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
