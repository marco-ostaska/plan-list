const assert = require("assert");
const fs = require("fs");
const path = require("path");

function readPostitSource() {
  return fs.readFileSync(path.join(__dirname, "..", "public", "postit.jsx"), "utf8");
}

function testPostitCanDeleteTasks() {
  const source = readPostitSource();

  assert.ok(source.includes("onDelete"), "post-it task cards should expose a delete action");
  assert.ok(source.includes("window.deleteLine(content, task.lineIdx)"), "post-it delete should remove the task line from markdown");
}

testPostitCanDeleteTasks();
