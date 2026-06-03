const assert = require("assert");
const fs = require("fs");
const path = require("path");

function testReadableBlocksDoNotEditOnSingleClick() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "editor.jsx"), "utf8");

  assert.strictEqual(
    source.includes("onClick={startEdit}"),
    false,
    "readable markdown blocks should not enter edit mode on single click"
  );
  assert.ok(
    source.includes("onDoubleClick={startEdit}"),
    "readable markdown blocks should keep an explicit edit gesture"
  );
}

function testNewAutofocusedBlocksSaveWhileTyping() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "editor.jsx"), "utf8");

  assert.ok(
    source.includes("const [liveUpdate] = React.useState(!!autoFocus);"),
    "new autofocused blocks should remember that they need live updates"
  );
  assert.ok(
    source.includes("if (liveUpdate) onUpdate(block, value);"),
    "typing into a newly inserted task should update the document before blur"
  );
}

function testNoteButtonCreatesEditableContent() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "editor.jsx"), "utf8");

  assert.ok(
    source.includes('else if (kind === "para") newLine = "Nova nota";'),
    "new notes should create a paragraph block that can be edited and saved"
  );
}

function testEditorCanDeleteTasks() {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "editor.jsx"), "utf8");

  assert.ok(source.includes("onDeleteTask"), "task rows should expose a delete action");
  assert.ok(source.includes("window.deleteLine(content, block.lineIdx)"), "task delete should remove the task line from markdown");
}

testReadableBlocksDoNotEditOnSingleClick();
testNewAutofocusedBlocksSaveWhileTyping();
testNoteButtonCreatesEditableContent();
testEditorCanDeleteTasks();
