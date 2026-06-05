const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { TaskStore } = require("../src/task-store");

async function createStore(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "task-tracker-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return new TaskStore(path.join(directory, "tasks.json"));
}

test("adds tasks with sequential IDs and todo status", async (t) => {
  const store = await createStore(t);

  const firstTask = await store.add("First task");
  const secondTask = await store.add("Second task");
  const storedTasks = await store.read();

  assert.equal(firstTask.id, 1);
  assert.equal(secondTask.id, 2);
  assert.equal(firstTask.status, "todo");
  assert.match(firstTask.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(storedTasks, [firstTask, secondTask]);
});

test("updates a task description while preserving its creation time", async (t) => {
  const store = await createStore(t);
  const originalTask = await store.add("Old description");

  const updatedTask = await store.update(originalTask.id, "New description");

  assert.equal(updatedTask.description, "New description");
  assert.equal(updatedTask.createdAt, originalTask.createdAt);
  assert.ok(updatedTask.updatedAt >= originalTask.updatedAt);
});

test("changes status and filters task lists", async (t) => {
  const store = await createStore(t);
  const firstTask = await store.add("Todo task");
  const secondTask = await store.add("Active task");

  await store.changeStatus(secondTask.id, "in-progress");
  await store.changeStatus(firstTask.id, "done");

  assert.deepEqual(
    (await store.list("done")).map((task) => task.id),
    [firstTask.id],
  );
  assert.deepEqual(
    (await store.list("in-progress")).map((task) => task.id),
    [secondTask.id],
  );
  assert.equal((await store.list()).length, 2);
});

test("deletes a task without reusing its ID", async (t) => {
  const store = await createStore(t);
  const firstTask = await store.add("Delete me");
  await store.add("Keep me");

  await store.remove(firstTask.id);
  const replacementTask = await store.add("New task");

  assert.equal(replacementTask.id, 3);
  assert.deepEqual(
    (await store.list()).map((task) => task.description),
    ["Keep me", "New task"],
  );
});

test("reports missing tasks and invalid statuses", async (t) => {
  const store = await createStore(t);

  await assert.rejects(() => store.update(99, "Missing"), /Task 99 was not found/);
  await assert.rejects(() => store.remove(99), /Task 99 was not found/);
  await assert.rejects(() => store.changeStatus(99, "blocked"), /Invalid status/);
  await assert.rejects(() => store.list("blocked"), /Invalid status/);
});

test("reports malformed JSON instead of overwriting it", async (t) => {
  const store = await createStore(t);
  await fs.writeFile(store.filePath, "{not-json", "utf8");

  await assert.rejects(() => store.list(), /Could not parse/);
});
