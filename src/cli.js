const { TaskStore } = require("./task-store");

const HELP_TEXT = `Task Tracker CLI

Usage:
  task-cli add "Task description"
  task-cli update <id> "New description"
  task-cli delete <id>
  task-cli mark-in-progress <id>
  task-cli mark-done <id>
  task-cli mark-todo <id>
  task-cli list [todo|in-progress|done]
  task-cli help`;

async function run(
  args,
  { store = new TaskStore(), stdout = console.log } = {},
) {
  const [command, ...commandArgs] = args;

  switch (command) {
    case "add":
      console.log(command, commandArgs);
      return addTask(commandArgs, store, stdout);
    case "update":
      return updateTask(commandArgs, store, stdout);
    case "delete":
      return deleteTask(commandArgs, store, stdout);
    case "mark-in-progress":
      return markTask(commandArgs, "in-progress", store, stdout);
    case "mark-done":
      return markTask(commandArgs, "done", store, stdout);
    case "mark-todo":
      return markTask(commandArgs, "todo", store, stdout);
    case "list":
      return listTasks(commandArgs, store, stdout);
    case "help":
    case "--help":
    case "-h":
    case undefined:
      stdout(HELP_TEXT);
      return;
    default:
      throw new Error(
        `Unknown command: ${command}. Run "task-cli help" for usage.`,
      );
  }
}

async function addTask(args, store, stdout) {
  requireArgumentCount(args, 1, 'Usage: task-cli add "Task description"');
  const description = parseDescription(args[0]);
  const task = await store.add(description);
  stdout(`Task added successfully (ID: ${task.id})`);
}

async function updateTask(args, store, stdout) {
  requireArgumentCount(
    args,
    2,
    'Usage: task-cli update <id> "New description"',
  );
  const id = parseId(args[0]);
  const description = parseDescription(args[1]);
  await store.update(id, description);
  stdout(`Task ${id} updated successfully`);
}

async function deleteTask(args, store, stdout) {
  requireArgumentCount(args, 1, "Usage: task-cli delete <id>");
  const id = parseId(args[0]);
  await store.remove(id);
  stdout(`Task ${id} deleted successfully`);
}

async function markTask(args, status, store, stdout) {
  requireArgumentCount(args, 1, `Usage: task-cli mark-${status} <id>`);
  const id = parseId(args[0]);
  await store.changeStatus(id, status);
  stdout(`Task ${id} marked as ${status}`);
}

async function listTasks(args, store, stdout) {
  if (args.length > 1) {
    throw new Error("Usage: task-cli list [todo|in-progress|done]");
  }

  const tasks = await store.list(args[0]);

  if (tasks.length === 0) {
    stdout("No tasks found.");
    return;
  }

  stdout(formatTasks(tasks));
}

function formatTasks(tasks) {
  const idWidth = Math.max(2, ...tasks.map((task) => String(task.id).length));
  const statusWidth = Math.max(6, ...tasks.map((task) => task.status.length));
  const header = `${"ID".padEnd(idWidth)}  ${"STATUS".padEnd(statusWidth)}  DESCRIPTION`;
  const separator = `${"-".repeat(idWidth)}  ${"-".repeat(statusWidth)}  -----------`;
  const rows = tasks.map(
    (task) =>
      `${String(task.id).padEnd(idWidth)}  ${task.status.padEnd(statusWidth)}  ${task.description}`,
  );

  return [header, separator, ...rows].join("\n");
}

function parseId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1 || String(id) !== value) {
    throw new Error(`Invalid task ID: ${value}.`);
  }

  return id;
}

function parseDescription(value) {
  const description = value.trim();

  if (!description) {
    throw new Error("Task description cannot be empty.");
  }

  return description;
}

function requireArgumentCount(args, expected, usage) {
  if (args.length !== expected) {
    throw new Error(usage);
  }
}

module.exports = { HELP_TEXT, formatTasks, run };
