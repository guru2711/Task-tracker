const assert = require("node:assert/strict");
const test = require("node:test");

const { HELP_TEXT, run } = require("../src/cli");

function createFakeStore(overrides = {}) {
  return {
    add: async (description) => ({ id: 1, description }),
    update: async () => {},
    remove: async () => {},
    changeStatus: async () => {},
    list: async () => [],
    ...overrides,
  };
}

function captureOutput() {
  const messages = [];
  return {
    messages,
    stdout: (message) => messages.push(message),
  };
}

test("shows help when no command is provided", async () => {
  const output = captureOutput();

  await run([], { store: createFakeStore(), stdout: output.stdout });

  assert.deepEqual(output.messages, [HELP_TEXT]);
});

test("passes add and update descriptions to the store", async () => {
  const calls = [];
  const store = createFakeStore({
    add: async (description) => {
      calls.push(["add", description]);
      return { id: 7 };
    },
    update: async (id, description) => calls.push(["update", id, description]),
  });
  const output = captureOutput();

  await run(["add", "  Read docs  "], { store, stdout: output.stdout });
  await run(["update", "7", "Write tests"], { store, stdout: output.stdout });

  assert.deepEqual(calls, [
    ["add", "Read docs"],
    ["update", 7, "Write tests"],
  ]);
  assert.deepEqual(output.messages, [
    "Task added successfully (ID: 7)",
    "Task 7 updated successfully",
  ]);
});

test("maps status commands to the correct store status", async () => {
  const calls = [];
  const store = createFakeStore({
    changeStatus: async (id, status) => calls.push([id, status]),
  });

  await run(["mark-in-progress", "2"], { store, stdout: () => {} });
  await run(["mark-done", "2"], { store, stdout: () => {} });
  await run(["mark-todo", "2"], { store, stdout: () => {} });

  assert.deepEqual(calls, [
    [2, "in-progress"],
    [2, "done"],
    [2, "todo"],
  ]);
});

test("formats listed tasks in a readable table", async () => {
  const output = captureOutput();
  const store = createFakeStore({
    list: async (status) => {
      assert.equal(status, "done");
      return [{ id: 3, status: "done", description: "Ship release" }];
    },
  });

  await run(["list", "done"], { store, stdout: output.stdout });

  assert.match(output.messages[0], /ID\s+STATUS\s+DESCRIPTION/);
  assert.match(output.messages[0], /3\s+done\s+Ship release/);
});

test("rejects unknown commands and invalid arguments", async () => {
  const store = createFakeStore();

  await assert.rejects(
    () => run(["unknown"], { store, stdout: () => {} }),
    /Unknown command/,
  );
  await assert.rejects(
    () => run(["add", "   "], { store, stdout: () => {} }),
    /cannot be empty/,
  );
  await assert.rejects(
    () => run(["delete", "01"], { store, stdout: () => {} }),
    /Invalid task ID/,
  );
  await assert.rejects(
    () => run(["list", "todo", "extra"], { store, stdout: () => {} }),
    /Usage/,
  );
});
