# Lodestar

Pub/Sub IPC Star Network for OllieOS

## Usage

Add to your program's pkgbuild config:
```js
const deps = ["lodestar"];
```

Use IPC to talk to Lodestar, for example, to publish a message to a topic:
```js
const ipc = term.get_ipc();
const channel = ipc.create_channel(process.pid, "lodestar");

if (!channel) {
    term.writeln("Failed to create IPC channel to Lodestar service. Is the lodestard running?");
    return 1;
}

const publish_msg = {
    type: "publish",
    topic,
    message,
};

ipc.channel_send(channel, process.pid, publish_msg);
```

See [lodestar-send](./src/send/index.ts) for a complete example of publishing messages.

See [lodestar-sub-test](./src/sub_test/index.ts) for a complete example of subscribing to messages.

## Topic syntax

Topics are strings composed of levels separated by dots (`.`). Each level can contain alphanumeric characters, underscores (`_`), and hyphens (`-`).

Topics can also include wildcards for flexible subscriptions. For example:
- `*` matches all topics at a single level.
- `sports.*` matches any topic that starts with `sports.` followed by a single level (e.g., `sports.football`, `sports.basketball`).
- `sports.*.scores` matches topics like `sports.football.scores` and `sports.basketball.scores`.
- `**` is not yet supported.
- `#` is not yet supported.
