# craftpr

![demo](./demo.mp4)

A CLI tool that aims to simplify
(gamify??) the process of reviewing code changes, creating commits, and generating pull requests.

## Tasks

- handle large files
- readme and docs

### Done

- fix the diff algorithm for better diffs
- handling binary files
- handling added and deleted files
- syntax support for multiple languages


## Planned Features

### creating commits

review changes, clean up code to remove (and save) unnessary changes
stage and create a commit with conventional commit message

### diffing against a different branch

impl: git status + git diff to identify changed/added/deleted files.
handle merge conflicts, reset commits to recreate a single clean commit, force push?

- creating prs: might come in handy to auto create or help create a PR on top of the target branch
