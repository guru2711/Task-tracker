const fs = require("node:fs/promises");
const path = require("node:path");

const VALID_STATUSES = new Set(["todo", "in-progress", "done"]);

class TaskStore {
  constructor(filePath = path.join(process.cwd(), "tasks.json")) {
    this.filePath = filePath;
  }

  async add(description) {
    const tasks = await this.read();
    const now = new Date().toISOString();
    const task = {
      id: this.nextId(tasks),
      description,
      status: "todo",
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(task);
    await this.write(tasks);
    return task;
  }

  async update(id, description) {
    const tasks = await this.read();
    const task = this.findTask(tasks, id);

    task.description = description;
    task.updatedAt = new Date().toISOString();
    await this.write(tasks);
    return task;
  }

  async remove(id) {
    const tasks = await this.read();
    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new Error(`Task ${id} was not found.`);
    }

    const [removedTask] = tasks.splice(taskIndex, 1);
    await this.write(tasks);
    return removedTask;
  }

  async changeStatus(id, status) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Invalid status: ${status}.`);
    }

    const tasks = await this.read();
    const task = this.findTask(tasks, id);

    task.status = status;
    task.updatedAt = new Date().toISOString();
    await this.write(tasks);
    return task;
  }

  async list(status) {
    if (status && !VALID_STATUSES.has(status)) {
      throw new Error(`Invalid status: ${status}.`);
    }

    const tasks = await this.read();
    return status ? tasks.filter((task) => task.status === status) : tasks;
  }

  async read() {
    let contents;

    try {
      contents = await fs.readFile(this.filePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }

      throw error;
    }

    if (!contents.trim()) {
      return [];
    }

    let tasks;
    try {
      tasks = JSON.parse(contents);
    } catch {
      throw new Error(`Could not parse ${this.filePath}.`);
    }

    if (!Array.isArray(tasks)) {
      throw new Error(`Expected ${this.filePath} to contain a JSON array.`);
    }

    return tasks;
  }

  async write(tasks) {
    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.tmp`;

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(temporaryPath, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }

  findTask(tasks, id) {
    const task = tasks.find((candidate) => candidate.id === id);

    if (!task) {
      throw new Error(`Task ${id} was not found.`);
    }

    return task;
  }

  nextId(tasks) {
    return tasks.reduce((highestId, task) => Math.max(highestId, task.id), 0) + 1;
  }
}

module.exports = { TaskStore, VALID_STATUSES };
