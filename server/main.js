#! /usr/bin/env node

// check if git is installed
// look for a git repository in cwd
// start express server with api and serve static files from client/dist
// create a post call for returning a list of changed files

const { execSync } = require("child_process");
const simpleGit = require("simple-git");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

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
  app.post("/changed-files", async (req, res) => {
    try {
      const status = await git.status();
      res.json({ changedFiles: status.files.map((file) => file.path) });
    } catch (error) {
      console.error("Error getting changed files:", error);
      res.status(500).json({ error: "Error getting changed files" });
    }
  });

  app.get("/test", (req, res) => {
    res.json({ test: "test" });
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
