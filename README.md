# Task Tracker CLI

A dependency-free Node.js command-line application for managing tasks in a local
JSON file.

## Requirements

- Node.js 18 or newer
- npm

## Setup

From the project directory, register the `task-cli` command:

```bash
npm link
```

You can also run commands without linking:

```bash
node index.js <command>
```

## Commands

### Add a task

```bash
task-cli add "Write project documentation"
```

New tasks start with the `todo` status.

### List tasks

```bash
task-cli list
task-cli list todo
task-cli list in-progress
task-cli list done
```

### Update a task

```bash
task-cli update 1 "Write detailed project documentation"
```

### Change a task's status

```bash
task-cli mark-in-progress 1
task-cli mark-done 1
task-cli mark-todo 1
```

### Delete a task

```bash
task-cli delete 1
```

### Show help

```bash
task-cli help
```

## Data Storage

The application creates `tasks.json` in the directory where the command is run.
Each task has the following structure:

```json
{
  "id": 1,
  "description": "Write project documentation",
  "status": "todo",
  "createdAt": "2026-06-05T03:25:29.491Z",
  "updatedAt": "2026-06-05T03:25:29.491Z"
}
```

Writes use a temporary file and rename operation to reduce the risk of leaving
partially written JSON.

## Testing

Run the automated tests:

```bash
npm test
```

The tests use temporary directories, so they do not modify your real
`tasks.json` file.

https://roadmap.sh/projects/task-tracker
