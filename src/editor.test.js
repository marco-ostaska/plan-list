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

testReadableBlocksDoNotEditOnSingleClick();
