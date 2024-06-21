#! /usr/bin/env node

const { execSync, exec } = require("child_process");
const simpleGit = require("simple-git");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const parseGitDiff = require("parse-git-diff").default;

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
      const filePath = req.query.path;
      const fullPath = path.resolve(process.cwd(), filePath);
      const diffSummary = await git.diffSummary(["HEAD", "--", filePath]);
      const fileSummary = diffSummary.files.find(
        (file) => file.file === filePath,
      );
      if (fileSummary?.binary) {
        return res.json({ type: "binary" });
      }

      // TODO: do we need to add safety here
      const fileStatus = (await git.status([filePath])).files[0];

      const status =
        fileStatus.index === "?"
          ? "A"
          : fileStatus.working_dir && fileStatus.working_dir !== " "
          ? fileStatus.working_dir
          : fileStatus.index;

      if (!fileSummary && status !== "A") {
        return res.status(400).json({ error: "File not found in git status." });
      }

      if (status === "A") {
        // added file
        // TODO: handle large files
        const buffer = await readFileAsync(fullPath);
        if (buffer.subarray(0, 512).includes(0)) {
          return res.json({ type: "binary" });
        }
        return res.json({ type: "added", content: buffer.toString("utf-8") });
      } else if (status === "D") {
        // deleted file
        // TODO: get file buffer in index
        return res.json({ type: "deleted" });
      } else {
        // modified file
        const diff = await git.diff(["HEAD", filePath]);
        const diffTree = parseGitDiff(diff);
        return res.json({ diff: diffTree?.files?.[0] });
      }
    } catch (error) {
      console.log("file diff error", error);
      return res.status(500).json({});
    }
  });

  app.post("/open", async (req, res) => {
    try {
      const filePath = req.query.path;
      const line = req.query.line;
      const fullPath = path.resolve(process.cwd(), filePath);
      await execAsync(`code --goto '${fullPath}':${line}`);
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
